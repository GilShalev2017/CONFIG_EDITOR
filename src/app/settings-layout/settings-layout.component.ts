import { Component, ComponentFactoryResolver, ComponentRef, Type } from '@angular/core';
import { AiProvidersComponent } from '../ai-providers/ai-providers.component';

// Example components for the right panel
@Component({
  template: '<p>General Settings Content</p>'
})
export class GeneralSettingsComponent { }

@Component({
  template: '<p>Display Settings Content</p>'
})
export class DisplaySettingsComponent { }

@Component({
  template: '<p>Network Settings Content</p>'
})
export class NetworkSettingsComponent { }

interface SettingsItem {
  label: string;
  component: Type<any>;
  icon: string; 
}

@Component({
  selector: 'app-settings-layout',
  standalone: false,
  // imports: [],
  templateUrl: './settings-layout.component.html',
  styleUrl: './settings-layout.component.scss'
})
export class SettingsLayoutComponent {
  items: SettingsItem[] = [
    { label: 'General', component: GeneralSettingsComponent, icon: 'settings' },
    { label: 'Display', component: DisplaySettingsComponent, icon: 'display_settings' },
    { label: 'Network', component: NetworkSettingsComponent, icon: 'network_wifi' },
    { label: 'Providers', component: AiProvidersComponent, icon: 'network_wifi' }
  ];
  filteredItems: SettingsItem[] = [...this.items];
  selectedItem: SettingsItem | null = null;
  searchTerm: string = '';

  constructor(private componentFactoryResolver: ComponentFactoryResolver) { 
  }

  selectItem(item: SettingsItem) {
    this.selectedItem = item;
  }

  filterItems() {
    this.filteredItems = this.items.filter(item =>
      item.label.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }
}
