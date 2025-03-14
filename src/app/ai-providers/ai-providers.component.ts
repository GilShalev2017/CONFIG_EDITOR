import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { JsonEditorOptions } from 'ang-jsoneditor';
import { ElectronService } from '../core/services';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { Language, Provider } from '../models/model';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { map, Observable, startWith } from 'rxjs';
import { allLanguages } from './allLanguages';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialog } from '@angular/material/dialog';
import { ConfigureProviderComponent } from '../congifure-provider/congifure-provider.component';

@Component({
  selector: 'app-ai-providers',
  standalone: false,
  // imports: [],
  templateUrl: './ai-providers.component.html',
  styleUrl: './ai-providers.component.scss'
})
export class AiProvidersComponent implements OnInit {

  //providers fields
  transcriptionProviders: Provider[] = [];
  translationProviders: Provider[] = [];
  textAnalysisProviders: Provider[] = [];
  //faceDetectionProviders: Provider[] = [];
  otherProviders: Provider[] = [];
  providers: Provider[] = [];
  //stepper fields
  firstFormGroup = this._formBuilder.group({
  });
  secondFormGroup = this._formBuilder.group({
    secondCtrl: ['', Validators.required],
  });
  isLinear = true
  //languages fields  
  selectedLanguage: Language | null = null; // Store selected language
  languages: Language[] = []; //selected 
  allLanguages: Language[] = allLanguages;
  displayedColumns: string[] = ['englishName', 'displayName', 'isocode', 'actions'];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  languageControl = new FormControl('', Validators.required);
  filteredLanguages: Observable<Language[]> = new Observable<Language[]>();
  dataSource: MatTableDataSource<Language> = new MatTableDataSource<Language>();

  constructor(private electronService: ElectronService, 
              private _formBuilder: FormBuilder,
              private cdr: ChangeDetectorRef,
              private dialog: MatDialog) {
  }

  submit() {
    throw new Error('Method not implemented.');
  }

  ngOnInit(): void {
    this.loadInisghtProvidersXml();
    this.loadAiLanguagesXml();

    this.filteredLanguages = this.languageControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || ''))
    );
  }

  async loadAiLanguagesXml() {
    const languagesObj = await this.electronService.ipcRenderer.invoke('read-ai-languages-xml');
    const languagesArr = languagesObj['languages']['language'] || [];
    this.languages = languagesArr.map((language: any) => ({
      englishName: language.$?.englishName || '',
      displayName: language.$?.displayName || '',
      isocode: language.$?.isocode || ''
    }));
    this.dataSource.data = this.languages;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  async loadInisghtProvidersXml() {
    try {
      const xmlString = await this.electronService.ipcRenderer.invoke('read-insight-providers-xml');
      const providersArr = xmlString['configuration']['aiProviders'][0].provider;
      this.providers = providersArr.map((provider: any) => ({
        name: provider.$?.name || '', // Extract name from '$'
        displayName: provider.$?.displayname || '', // Extract displayname from '$'
        description: provider.description || undefined,
        cost: provider.cost,
        apiUrl: provider.apiUrl || undefined,
        apiInternalKey: provider.apiInternalKey,
        insightTypes: (provider.insightTypes || []).map((insight: any) => ({
          name: insight.name,
          displayName: insight.displayName,
          sourceInsightType: insight.sourceInsightType || undefined,
          sourcedata: insight.sourcedata || undefined
        })),
        // Varied properties
        modelType: provider.modelType || undefined,
        timeoutInMinutes: provider.timeoutInMinutes || undefined,
        location: provider.location || undefined,
        serviceType: provider.serviceType || undefined,
        apiKey: provider.apiKey || undefined,
        entraclientid: provider.entraclientid || undefined,
        entratenantid: provider.entratenantid || undefined,
        armvilocation: provider.armvilocation || undefined,
        armviaccountname: provider.armviaccountname || undefined,
        armviaccountid: provider.armviaccountid || undefined,
        armvisubscriptionid: provider.armvisubscriptionid || undefined,
        armviresourcegroup: provider.armviresourcegroup || undefined,
        languagesUrl: provider.languagesUrl || undefined,
        //ui fields
        showFullText: false,
        enabled: true
      }));

      this.transcriptionProviders = this.providers.filter(p => p.name.includes('Transcriber'));
      this.translationProviders = this.providers.filter(p => p.name.includes('Translator'));
      this.textAnalysisProviders = this.providers.filter(p => p.name.includes('TextAnalysis'));
      this.otherProviders = this.providers.filter(p =>
        !this.transcriptionProviders.includes(p) &&
        !this.translationProviders.includes(p) &&
        !this.textAnalysisProviders.includes(p)
      );
    } catch (error) {
      console.error('Error loading XML:', error);
    }
  }

  drop(event: CdkDragDrop<any[]>, type: string) {
    if (type === 'transcription') {
      moveItemInArray(this.transcriptionProviders, event.previousIndex, event.currentIndex);
    } else if (type === 'translation') {
      moveItemInArray(this.translationProviders, event.previousIndex, event.currentIndex);
    } else if (type === 'textAnalysis') {
      moveItemInArray(this.textAnalysisProviders, event.previousIndex, event.currentIndex);
    } else if (type === 'others') {
      moveItemInArray(this.otherProviders, event.previousIndex, event.currentIndex);
    }
  }

  getProviderIcon(providerName: string): string {
    const icons: { [key: string]: string } = {
      'Whisper': 'whisper.png',
      'Open AI': 'openai.png',
      'Speechmatix': 'speechmatix.png',
      'Azure': 'azure.png',
      'ClosedCaption Transcriber': 'closed-captions.png'
    };
    return `assets/provider-icons/${icons[providerName] || 'default.png'}`;
  }

  toggleText(provider: any) {
    provider.showFullText = !provider.showFullText;
  }

  isDescriptionLong(provider: any): boolean {
    const description = String(provider.description ?? '');
    return description.length > 100;
  }

  toggleProvider(provider: any) {
    provider.enabled = !provider.enabled;
    this.cdr.detectChanges(); // Force update
  }


  private _filter(value: string | Language): Language[] {
    let filterValue = '';

    if (typeof value === 'string') {
      filterValue = value.toLowerCase();
    } else if (value && value.englishName) {
      filterValue = value.englishName.toLowerCase();
    }

    return this.allLanguages.filter(option =>
      option.englishName.toLowerCase().includes(filterValue) &&
      !this.languages.some(lang => lang.isocode === option.isocode) // Exclude already selected
    );
  }

  // Save the selected language for when the button is clicked
  onLanguageSelected(event: MatAutocompleteSelectedEvent) {
    const selectedName = event.option.value;
    this.selectedLanguage = this.allLanguages.find(lang => lang.englishName === selectedName) || null;
  }

  addSelectedLanguage() {
    if (this.selectedLanguage && !this.languages.some(lang => lang.isocode === this.selectedLanguage!.isocode)) {
      this.languages.unshift(this.selectedLanguage);
      this.languageControl.setValue(''); // Clear input after adding
      this.selectedLanguage = null; // Reset selected language
      this.dataSource.data = [...this.languages]; 
    }
  }

  addLanguage(lang: Language) {
    if (!this.languages.some(l => l.isocode === lang.isocode)) {
      this.languages.unshift(lang); // Add to selected languages list
      this.dataSource.data = [...this.languages]; // Refresh table data source
    }
    this.languageControl.setValue(''); // Clear input field
  }

  removeLanguage(lang: Language) {
    this.languages = this.languages.filter(l => l.isocode !== lang.isocode); // Remove from selected list
    this.dataSource.data = [...this.languages];
  }

  editLanguage(language: any): void {
    language.originalDisplayName = language.displayName; // Store original value
    language.isEditing = true;
    this.cdr.detectChanges();
  }
   
  // saveLanguage(language: any): void {
  //   language.isEditing = false;
  //   // Update the model directly, in case you need to update it
  //   const index = this.languages.findIndex(l => l.isocode === language.isocode);
  //   if (index !== -1) {
  //     this.languages[index] = { ...language }; // Update the language model
  //   }
  //   // You can add API call here to save the changes if needed
  // }

  saveLanguage(language: any): void {
    if (!language.displayName.trim()) {
      language.displayName = language.originalDisplayName;
    }
    language.isEditing = false;
  
    const updatedLanguages = this.languages.map(lang => {
      if (lang.isocode === language.isocode) {
        return { ...language };
      }
      return lang;
    });
  
    this.languages = updatedLanguages;
  
    // Create a new MatTableDataSource instance
    this.dataSource = new MatTableDataSource(this.languages);
  
    this.dataSource.paginator = this.paginator; // Re-assign paginator
    this.dataSource.sort = this.sort; // Re-assign sort
  
    this.cdr.detectChanges();
  }  
  
  cancelEdit(language: any): void {
    language.displayName = language.originalDisplayName; // Revert changes
    language.isEditing = false;
    this.cdr.detectChanges();
  }
 
  configureProvider(provider: Provider)  {
    const dialogRef = this.dialog.open(ConfigureProviderComponent, {
      width: '400px',
      data: { provider: { ...provider } } // Pass a copy
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Update the provider with the result
        const index = this.providers.findIndex(p => p.name === result.name);
        if (index !== -1) {
          this.providers[index] = result;
          this.loadInisghtProvidersXml();
        }
      }
    });
  }
}
