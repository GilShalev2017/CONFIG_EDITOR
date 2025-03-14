import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Provider } from '../models/model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-congifure-provider',
  templateUrl: './congifure-provider.component.html',
  styleUrl: './congifure-provider.component.scss'
})
export class ConfigureProviderComponent implements OnInit {
  providerForm: FormGroup;
  provider: Provider;

  constructor(
    public dialogRef: MatDialogRef<ConfigureProviderComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { provider: Provider },
    private fb: FormBuilder
  ) {
    this.provider = { ...data.provider }; // Create a copy
    this.providerForm = this.fb.group({
      apiInternalKey: [this.provider.apiInternalKey, Validators.required],
      modelType: [this.provider.modelType],
      timeoutInMinutes: [this.provider.timeoutInMinutes],
      location: [this.provider.location],
      serviceType: [this.provider.serviceType],
      apiKey: [this.provider.apiKey],
      entraclientid: [this.provider.entraclientid],
      entratenantid: [this.provider.entratenantid],
      armvilocation: [this.provider.armvilocation],
      armviaccountname: [this.provider.armviaccountname],
      armviaccountid: [this.provider.armviaccountid],
      armvisubscriptionid: [this.provider.armvisubscriptionid],
      armviresourcegroup: [this.provider.armviresourcegroup],
      languagesUrl: [this.provider.languagesUrl],
    });
  }

  ngOnInit(): void {
    // Optionally perform logic based on provider type here
  }

  onSave(): void {
    if (this.providerForm.valid) {
      this.dialogRef.close({ ...this.provider, ...this.providerForm.value });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  get providerType(): string {
    if (this.provider.name.includes('Whisper')) return 'Whisper';
    if (this.provider.name.includes('Azure')) return 'Azure';
    if (this.provider.name.includes('Speechmatix')) return 'Speechmatix';
    if (this.provider.name.includes('AzureVideoIndexer')) return 'AzureVideoIndexer';
    return 'Unknown';
  }
}