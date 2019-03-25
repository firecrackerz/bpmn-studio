import {EventAggregator} from 'aurelia-event-aggregator';
import {bindable, inject} from 'aurelia-framework';

import {DataModels} from '@process-engine/management_api_contracts';

import {IDiagram} from '@process-engine/solutionexplorer.contracts';
import {CorrelationListSortProperty, ICorrelationSortSettings, ICorrelationTableEntry} from '../../../../../../../contracts/index';
import environment from '../../../../../../../environment';
import {DateService} from '../../../../../../../services/date-service/date.service';
import {IProcessInstanceWithCorrelation} from '../../../../contracts/index';

@inject(EventAggregator)
export class CorrelationList {

  @bindable public selectedProcessInstance: DataModels.Correlations.CorrelationProcessModel;
  @bindable public correlations: Array<DataModels.Correlations.Correlation>;
  @bindable public processInstances: Array<DataModels.Correlations.CorrelationProcessModel>;
  @bindable public activeDiagram: IDiagram;
  public sortedTableData: Array<ICorrelationTableEntry>;
  public CorrelationListSortProperty: typeof CorrelationListSortProperty = CorrelationListSortProperty;
  public sortSettings: ICorrelationSortSettings = {
    ascending: false,
    sortProperty: undefined,
  };
  public processInstancesWithCorrelation: Array<IProcessInstanceWithCorrelation> = [];
  public selectedTableEntry: ICorrelationTableEntry;

  private _tableData: Array<ICorrelationTableEntry> = [];
  private _eventAggregator: EventAggregator;

  constructor(eventAggregator: EventAggregator) {
    this._eventAggregator = eventAggregator;
  }

  public showLogViewer(): void {
    this._eventAggregator.publish(environment.events.inspectCorrelation.showLogViewer);
  }

  public selectCorrelation(selectedTableEntry: ICorrelationTableEntry): void {
    this.selectedProcessInstance = this._getProcessModelForTableEntry(selectedTableEntry);
    this.selectedTableEntry = selectedTableEntry;
  }

  public correlationsChanged(): void {
    this.processInstancesWithCorrelation = [];
    this.processInstances = [];

    this.correlations.forEach((correlation: DataModels.Correlations.Correlation) => {
      correlation.processModels.forEach((processInstance: DataModels.Correlations.CorrelationProcessModel) => {
        const isNotSelectedProcessModel: boolean = processInstance.processModelId !== this.activeDiagram.id;

        if (isNotSelectedProcessModel) {
          return;
        }

        const processInstanceWithCorrelation: IProcessInstanceWithCorrelation = {
          processInstance: processInstance,
          correlation: correlation,
        };

        this.processInstancesWithCorrelation.push(processInstanceWithCorrelation);
        this.processInstances.push(processInstance);
      });
    });

    this._convertCorrelationsIntoTableData();

    // Select latest process instance
    const sortedTableData: Array<ICorrelationTableEntry> = this._sortListByStartDate();
    const tableDataIsExisiting: boolean = sortedTableData.length > 0;

    if (tableDataIsExisiting ) {
      const latestCorelationTableEntry: ICorrelationTableEntry = sortedTableData[sortedTableData.length - 1];

      this.selectCorrelation(latestCorelationTableEntry);
    }

    const sortSettingsExisitng: boolean = this.sortSettings.sortProperty !== undefined;
    if (sortSettingsExisitng) {
      this.sortSettings.ascending = !this.sortSettings.ascending;

      this.sortList(this.sortSettings.sortProperty);
    } else {
      this.sortSettings.sortProperty = CorrelationListSortProperty.Number;
      this.sortSettings.ascending = true;

      this.sortList(CorrelationListSortProperty.Number);
    }
  }

  private _convertCorrelationsIntoTableData(): void {
    this._tableData =
      this.processInstancesWithCorrelation.map((processInstanceWithCorrelation: IProcessInstanceWithCorrelation) => {
        const correlation: DataModels.Correlations.Correlation = processInstanceWithCorrelation.correlation;
        const processInstance: DataModels.Correlations.CorrelationProcessModel = processInstanceWithCorrelation.processInstance;

        const date: Date = new Date(processInstanceWithCorrelation.correlation.createdAt);
        const formattedStartedDate: string = new DateService(date)
                                              .year()
                                              .month()
                                              .day()
                                              .hours()
                                              .minutes()
                                              .asFormattedDate();

        const index: number = this._getIndexForProcessInstance(processInstance);
        const state: string = correlation.state.toUpperCase();

        const tableEntry: ICorrelationTableEntry = {
          index: index,
          startedAt: formattedStartedDate,
          state: state,
          user: 'Not supported yet.',
          correlationId: correlation.id,
          processInstanceId: processInstance.processInstanceId,
        };

        return tableEntry;
      });
  }

  public sortList(property: CorrelationListSortProperty): void {
    this.sortedTableData = [];

    const isSameSortPropertyAsBefore: boolean = this.sortSettings.sortProperty === property;
    const ascending: boolean = isSameSortPropertyAsBefore ? !this.sortSettings.ascending
                                                          : true;

    this.sortSettings.ascending = ascending;
    this.sortSettings.sortProperty = property;

    const sortByDate: boolean = property === CorrelationListSortProperty.StartedAt;

    const sortedTableData: Array<ICorrelationTableEntry> = sortByDate
                                                                ? this._sortListByStartDate()
                                                                : this._sortList(property);

    this.sortedTableData = ascending
                            ? sortedTableData
                            : sortedTableData.reverse();
  }

  private _sortList(property: CorrelationListSortProperty): Array<ICorrelationTableEntry> {
    const sortedTableData: Array<ICorrelationTableEntry> =
      this._tableData.sort((firstEntry: ICorrelationTableEntry, secondEntry: ICorrelationTableEntry) => {
        const firstEntryIsBigger: boolean = firstEntry[property] > secondEntry[property];
        if (firstEntryIsBigger) {
          return 1;
        }

        const secondEntryIsBigger: boolean = firstEntry[property] < secondEntry[property];
        if (secondEntryIsBigger) {
          return -1;
        }

        return 0;
      });

    return sortedTableData;
  }

  private _sortListByStartDate(): Array<ICorrelationTableEntry> {
    const sortedTableData: Array<ICorrelationTableEntry> =
      this._tableData.sort((firstEntry: ICorrelationTableEntry, secondEntry: ICorrelationTableEntry) => {
        const firstCorrelation: DataModels.Correlations.Correlation = this._getCorrelationForTableEntry(firstEntry);
        const secondCorrelation: DataModels.Correlations.Correlation = this._getCorrelationForTableEntry(secondEntry);

        const firstCorrelationDate: Date = new Date(firstCorrelation.createdAt);
        const secondCorrelationDate: Date = new Date(secondCorrelation.createdAt);

        const firstEntryIsBigger: boolean = firstCorrelationDate.getTime() > secondCorrelationDate.getTime();
        if (firstEntryIsBigger) {
          return 1;
        }

        const secondEntryIsBigger: boolean = firstCorrelationDate.getTime() < secondCorrelationDate.getTime();
        if (secondEntryIsBigger) {
          return -1;
        }

        return 0;
      });

    return sortedTableData;
  }

  private _getCorrelationForTableEntry(tableEntry: ICorrelationTableEntry): DataModels.Correlations.Correlation {
    const correlationForTableEntry: DataModels.Correlations.Correlation =
      this.correlations.find((correlation: DataModels.Correlations.Correlation) => {
        return correlation.id === tableEntry.correlationId;
      });

    return correlationForTableEntry;
  }

  private _getProcessModelForTableEntry(tableEntry: ICorrelationTableEntry): DataModels.Correlations.CorrelationProcessModel {
    const correlationForTableEntry: DataModels.Correlations.Correlation =
      this.correlations.find((correlation: DataModels.Correlations.Correlation) => {
        return correlation.id === tableEntry.correlationId;
      });

    const processModelForTableEntry: DataModels.Correlations.CorrelationProcessModel =
      correlationForTableEntry.processModels.find((processModel: DataModels.Correlations.CorrelationProcessModel) => {
        return processModel.processInstanceId === tableEntry.processInstanceId;
      });

    return processModelForTableEntry;
  }

  private _getIndexForProcessInstance(processInstance: DataModels.Correlations.CorrelationProcessModel): number {
    const processInstanceStartTime: Date = new Date(processInstance.createdAt);

    const earlierStartedProcessInstances: Array<IProcessInstanceWithCorrelation> =
      this.processInstancesWithCorrelation.filter((processInstanceWithCorrelation: IProcessInstanceWithCorrelation) => {
        const processInstanceEntry: DataModels.Correlations.CorrelationProcessModel = processInstanceWithCorrelation.processInstance;
        const entryStartedDate: Date = new Date(processInstanceEntry.createdAt);

        return entryStartedDate.getTime() < processInstanceStartTime.getTime();
      });

    const amountOfEarlierStartedProcessInstances: number = earlierStartedProcessInstances.length;
    const index: number = amountOfEarlierStartedProcessInstances + 1;

    return index;
  }
}
