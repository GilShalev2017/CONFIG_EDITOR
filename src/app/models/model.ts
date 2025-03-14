export interface InsightType{
  name: string;
  displayName: string;
  sourceInsightType?: string;
  sourcedata?: string;
}

export interface Provider {
  //Common to all providers
  name: string;
  onPremise?:boolean;
  displayName: string;
  description?: string;
  cost: number;
  apiUrl?: string;
  apiInternalKey: string;
  insightTypes: InsightType[];
  //Varied properties
  //Whisper
  modelType?: string; 
  timeoutInMinutes?: number; 
  //Azure
  location?: string; 
  //Speechmatix
  serviceType?: string 
  apiKey?: string; 
  //AzureVideoIndexer
  entraclientid?: string;
  entratenantid?: string;
  armvilocation?: string;
  armviaccountname?: string;
  armviaccountid?: string;
  armvisubscriptionid?: string;
  armviresourcegroup?: string;
  languagesUrl?: string; 
  //FOR UI
  showFullText?: boolean;
  enabled?: boolean;
}

export interface Language
{
  englishName: string;
  displayName: string;
  isocode: string;
}