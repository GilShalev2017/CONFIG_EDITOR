import { Component } from '@angular/core';
import { JsonEditorOptions } from 'ang-jsoneditor';

@Component({
  selector: 'app-ai-providers',
  standalone: false,
  // imports: [],
  templateUrl: './ai-providers.component.html',
  styleUrl: './ai-providers.component.scss'
})
export class AiProvidersComponent {

  public editorOptions: JsonEditorOptions | undefined;
  public data: any;

  constructor() {
    this.editorOptions = new JsonEditorOptions();
    this.editorOptions.modes = ['code', 'text', 'tree', 'view']; // Set allowed modes
    this.data = { "example": "data" };
  }
}
