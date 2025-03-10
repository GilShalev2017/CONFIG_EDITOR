import { Component, OnInit } from '@angular/core';
import { JsonEditorOptions } from 'ang-jsoneditor';
import { ElectronService } from '../core/services';

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
  form: any;
  
  constructor(private electronService: ElectronService) {
    this.editorOptions = new JsonEditorOptions();
    this.editorOptions.modes = ['tree'];//['code', 'text', 'tree', 'view']; // Set allowed modes
    //this.data = {"products":[{"name":"car","product":[{"name":"honda","model":[{"id":"civic","name":"civic"},{"id":"accord","name":"accord"},{"id":"crv","name":"crv"},{"id":"pilot","name":"pilot"},{"id":"odyssey","name":"odyssey"}]}]}]}

    // this.form = this.fb.group({
    //   myinput: [this.data]
    // });
  }

  submit() {
    throw new Error('Method not implemented.');
  }

  ngOnInit(): void {
    this.loadXml();
  }

  async loadXml() {
    try {
      this.data = await this.electronService.ipcRenderer.invoke('read-xml'); // Invoke read-xml
      console.log('XML loaded:', this.data);
    } catch (error) {
      console.error('Error loading XML:', error);
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
