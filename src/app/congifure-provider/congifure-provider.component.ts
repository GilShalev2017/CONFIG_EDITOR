import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Provider } from '../models/model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ElectronService } from '../core/services';

@Component({
  selector: 'app-congifure-provider',
  templateUrl: './congifure-provider.component.html',
  styleUrl: './congifure-provider.component.scss'
})
export class ConfigureProviderComponent implements OnInit {
  providerForm: FormGroup;
  provider: Provider;

  isTesting = false;
  testPassed = false;
  testMessage = '';

  constructor(
    public dialogRef: MatDialogRef<ConfigureProviderComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { provider: Provider },
    private fb: FormBuilder,
    private electronService: ElectronService
  ) {
  
    this.provider = { ...data.provider }; // Create a copy
  
    this.providerForm = this.fb.group({
      apiKeyType: ['client'], // Default to 'client'
      apiInternalKey: [this.provider.apiInternalKey, Validators.required],
      apiKey: [this.provider.apiKey],
      apiUrl: [this.provider.apiUrl],
      modelType: [this.provider.modelType],
      timeoutInMinutes: [this.provider.timeoutInMinutes],
      location: [this.provider.location],
      serviceType: [this.provider.serviceType],
      entraclientid: [this.provider.entraclientid],
      entratenantid: [this.provider.entratenantid],
      armvilocation: [this.provider.armvilocation],
      armviaccountname: [this.provider.armviaccountname],
      armviaccountid: [this.provider.armviaccountid],
      armvisubscriptionid: [this.provider.armvisubscriptionid],
      armviresourcegroup: [this.provider.armviresourcegroup],
      languagesUrl: [this.provider.languagesUrl],
      enabled: [this.provider.enabled],
      testPass: [this.provider.testPass],
    });
  }

  ngOnInit(): void {}

  onSave(): void {
    if (this.providerForm.valid) {
      this.dialogRef.close({ ...this.provider, ...this.providerForm.value });
    }
  }

  get providerType(): string {
    if (this.provider.name.includes('openAiTranscriber')) return 'OpenAiTranscriber';
    if (this.provider.name.includes('whisperTranscriber')) return 'WhisperTranscriber';
    if (this.provider.name.includes('azureTranslator')) return 'AzureTranslator';
    if (this.provider.name.includes('Speechmatix')) return 'Speechmatix';
    if (this.provider.name.includes('AzureVideoIndexer')) return 'AzureVideoIndexer';
    return 'Unknown';
  }

  async onTestConnection(): Promise<void> {
    if (this.providerForm.valid) {
      this.isTesting = true;
      this.testMessage = '';
      this.testPassed = false;
      const providerData = { ...this.provider, ...this.providerForm.value };

      try {
        const testConnectionResult = await this.electronService.ipcRenderer.invoke('test-provider-connection', providerData);
        this.testPassed = Boolean(testConnectionResult);
        this.testMessage = this.testPassed ? 'Verified' : 'Not Verified';
      } catch (error) {
        this.testMessage = 'Not Verified';
        this.testPassed = false;
      } finally {
        this.isTesting = false;
      }
    }
  }

  async onSaveAndEnable(): Promise<void> {
    if (this.testPassed) {
      const providerData = { ...this.provider, ...this.providerForm.value };
      try {
        providerData.enabled = true;
        providerData.testPass = true;
        await this.electronService.ipcRenderer.invoke('save-provider-configuration', providerData);
        this.dialogRef.close({ ...this.provider, ...this.providerForm.value, enabled: true, testPass: true });
      } catch (error) {
        console.error('Error saving provider configuration:', error);
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  get isVerifyDisabled(): boolean {
    const apiKeyType = this.providerForm.get('apiKeyType')?.value;
    const apiKey = this.providerForm.get('apiKey')?.value;
  
    if (this.isTesting) return true;
   
    if (this.provider.name === 'openAiTranscriber' &&  apiKeyType === 'client') {
      if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
        return true;
      }
    }
    return false;
  }
  
}