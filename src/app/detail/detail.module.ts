import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DetailRoutingModule } from './detail-routing.module';

import { DetailComponent } from './detail.component';
import { SharedModule } from '../shared/shared.module';
import {MatButtonToggleModule} from '@angular/material/button-toggle';

@NgModule({
  declarations: [DetailComponent],
  imports: [CommonModule, SharedModule, DetailRoutingModule,MatButtonToggleModule]
})
export class DetailModule {}
