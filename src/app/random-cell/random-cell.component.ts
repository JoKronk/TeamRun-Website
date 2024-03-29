import { SelectionModel } from '@angular/cdk/collections';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatAccordion, MatExpansionPanel } from '@angular/material/expansion';
import { MatDrawer } from '@angular/material/sidenav';
import { MatSliderChange } from '@angular/material/slider';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Cell } from './classes/cell';
import { Preset } from './classes/preset';
import { Rule } from './classes/rule';

@Component({
  selector: 'app-random-cell',
  templateUrl: './random-cell.component.html',
  styleUrls: ['./random-cell.component.scss']
})
export class RandomCellComponent implements OnInit {

  presets: Preset[] = Preset.ListPresets();
  preset: Preset = this.presets[0];

  sortedCells: Cell[] = [];
  displayedCells: Cell[] = [];
  cellsShown: number = 0;

  headers: string[] = ["selected", "name", "type", "description"];
  ruleSource: MatTableDataSource<Rule> = new MatTableDataSource(this.preset.rules.filter(x => !x.hidden));
  ruleSelection = new SelectionModel<Rule>(true, []);
  private ruleSort : MatSort = new MatSort();
  @ViewChild('ruleSort') set rSort(ms: MatSort) {
    if (!this.ruleSort)
      this.ruleSort = ms;
    this.ruleSource.sort = this.ruleSort;
  }

  @ViewChild('drawer') drawer: MatDrawer;
  @ViewChild(MatAccordion) accordion: MatAccordion = new MatAccordion();
  @ViewChild('settingsPanel', {static: true}) settingsPanel: MatExpansionPanel;
  @ViewChild('rulesPanel', {static: true}) rulesPanel: MatExpansionPanel;

  constructor() { }

  ngOnInit(): void {
    this.ruleMasterToggle();
  }

  randomize(element?: HTMLElement, resetSeed: boolean = true) {
    this.drawer.opened = false;
    
    if (resetSeed)
      this.preset.randomizer.seed = undefined;

    const rules = this.ruleSelection.selected.concat(this.preset.rules.filter(x => x.hidden));
    this.preset.randomizer.injections = rules.filter(x => x.type === Rule.InjectionType());
    this.preset.randomizer.restrictions = rules.filter(x => x.type === Rule.RestrictionType());
    this.preset.randomizer.randomizeOrder();

    this.sortedCells = this.preset.randomizer.cells.filter(x => x.cellNumber).sort((a,b) => ((a.cellNumber as number) > (b.cellNumber as number)) ? 1 : (((b.cellNumber as number) > (a.cellNumber as number)) ? -1 : 0));
    this.cellsShown = this.preset.randomizer.cellsShownInAdvance ? this.preset.randomizer.cellsShownInAdvance + 1 : this.sortedCells.length + 1;

    if (this.cellsShown < this.sortedCells.length) {
      this.displayedCells = this.sortedCells.slice(0, this.cellsShown);
      
      setTimeout(() => {
      this.drawer.opened = true;
      }, 1000); 
    }
    else {
      this.displayedCells = this.sortedCells;
    }

    if (element) {
      setTimeout(function (){
        element.scrollIntoView({behavior: 'smooth'});
      }, 350); 
    }
  }

  advanceRun(element : HTMLDivElement) {
    this.displayedCells.push(this.sortedCells[this.cellsShown])
    this.cellsShown++;

    if (this.runHasEnded())
      this.drawer.opened = false;

    setTimeout(function (){
      element.scrollIntoView({behavior: 'smooth', block: 'end'});
    }, 100); 
  }

  runHasEnded() {
    return this.cellsShown >= this.sortedCells.length;
  }


  updateRunCellCount(event: Event): void {
    this.preset.randomizer.cellsInRun = (event.target as HTMLInputElement).valueAsNumber ?? (this.presets.find(x => x.name === this.preset.name) as Preset).randomizer.cellsInRun;
  }

  updateCellsShownInAdvance(event: Event): void {
    this.preset.randomizer.cellsShownInAdvance = (event.target as HTMLInputElement).valueAsNumber;
  }

  updateLevelPercent(event: Event): void {
    this.preset.randomizer.sameLevelPercent = (event.target as HTMLInputElement).valueAsNumber;
  }

  updateHubPercent(event: Event): void {
    this.preset.randomizer.sameHubPercent = (event.target as HTMLInputElement).valueAsNumber;
  }

  updateOrbCellLevelPercent(event: Event): void {
    this.preset.randomizer.sameLevelPercentOrbCells = (event.target as HTMLInputElement).valueAsNumber;
  }


  isAllRulesSelected(): boolean {
    const numSelected = this.ruleSelection.selected.filter(x => !x.mandatory).length;
    const numRows = this.ruleSource.data.filter(x => !x.mandatory).length;
    return numSelected === numRows;
  }

  isNoneSelected(): boolean {
    return this.ruleSelection.selected.filter(x => !x.mandatory).length === 0;
  }

  rowToggle(rule: Rule) {
    if (rule.mandatory)
      return;
      
    this.ruleSelection.toggle(rule);
  }

  ruleMasterToggle() {
    if (this.isAllRulesSelected()) {
      this.ruleSelection.selected.forEach(x => {
        if (!x.mandatory)
          this.ruleSelection.deselect(x);
      });
      return;
    }
    this.ruleSelection.select(...this.ruleSource.data);
  }

  ruleTypes(): string[] {
    return Rule.ListRuleTypes();
  }

  updateRules() {
    this.ruleSource = new MatTableDataSource(this.preset.rules.filter(x => !x.hidden));
    this.ruleSource.sort = this.ruleSort;
    this.ruleSelection.clear();
    this.ruleMasterToggle();
  }
}
