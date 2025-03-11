import { Component, OnInit} from '@angular/core';
import { JsonEditorOptions } from 'ang-jsoneditor';
import { ElectronService } from '../core/services';
import { FormBuilder, Validators } from '@angular/forms';
import { Provider } from '../models/model';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-ai-providers',
  standalone: false,
  // imports: [],
  templateUrl: './ai-providers.component.html',
  styleUrl: './ai-providers.component.scss'
})
export class AiProvidersComponent implements OnInit{

  public editorOptions: JsonEditorOptions;
  public data: any;
  
  transcriptionProviders: Provider[] = [];
  translationProviders: Provider[] = [];
  textAnalysisProviders: Provider[] = [];
  //faceDetectionProviders: Provider[] = [];
  otherProviders: Provider[] = [];

  providers: Provider[] = [];
  
  firstFormGroup = this._formBuilder.group({
    firstCtrl: ['', Validators.required],
  });
  secondFormGroup = this._formBuilder.group({
    secondCtrl: ['', Validators.required],
  });
  isLinear = true
  
  constructor(private electronService: ElectronService,private _formBuilder: FormBuilder) {
    this.editorOptions = new JsonEditorOptions();
    this.editorOptions.modes = ['tree'];//['code', 'text', 'tree', 'view']; // Set allowed modes
  }

  submit() {
    throw new Error('Method not implemented.');
  }

  ngOnInit(): void {
    this.loadXml();
  }

  async loadXml() {
    try {
      const xmlString = await this.electronService.ipcRenderer.invoke('read-xml');
      console.log('XML loaded:', xmlString);
  
      const providersStr = xmlString['configuration']['aiProviders'];
      const providersArr = xmlString['configuration']['aiProviders'][0].provider;
      const length = providersArr.length;
  
      // Define the array of Provider objects
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
        languagesUrl: provider.languagesUrl || undefined
      }));
  
      console.log('Providers:', this.providers.length);
  
      this.transcriptionProviders = this.providers.filter(p => p.name.includes('Transcriber'));
      this.translationProviders = this.providers.filter(p => p.name.includes('Translator'));
      this.textAnalysisProviders = this.providers.filter(p => p.name.includes('TextAnalysis'));
      this.otherProviders = this.providers.filter(p => 
        !this.transcriptionProviders.includes(p) &&
        !this.translationProviders.includes(p) &&
        !this.textAnalysisProviders.includes(p)
      );
      // Further logic to use providers array
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
  
  async saveXml() {
    try {
      await this.electronService.ipcRenderer.invoke('edit-xml', this.data); // Invoke edit-xml
      console.log('XML saved successfully');
    } catch (error) {
      console.error('Error saving XML:', error);
    }
  }

  updateData(event: any) {
    this.data = event; // Update this.data with the changed data
    console.log("data changed: ", this.data);
  }
}
