import {bindable, inject} from 'aurelia-framework';

import * as clipboard from 'clipboard-polyfill';

import {DataModels} from '@process-engine/management_api_contracts';

import {ILogSortSettings, ISolutionEntry, LogSortProperty, NotificationType} from '../../../../../../../contracts/index';
import {DateService} from '../../../../../../../services/date-service/date.service';
import {NotificationService} from '../../../../../../../services/notification-service/notification.service';
import {IInspectCorrelationService} from '../../../../contracts';

interface IClipboard {
  writeText?(text: string): void;
}

@inject('NotificationService', 'InspectCorrelationService')
export class LogViewer {
  @bindable public log: Array<DataModels.Logging.LogEntry>;
  @bindable public processInstance: DataModels.Correlations.CorrelationProcessModel;
  @bindable public activeSolutionEntry: ISolutionEntry;
  public LogSortProperty: typeof LogSortProperty = LogSortProperty;
  public sortedLog: Array<DataModels.Logging.LogEntry>;
  public sortSettings: ILogSortSettings = {
    ascending: false,
    sortProperty: undefined,
  };

  private _notificationService: NotificationService;
  private _inspectCorrelationService: IInspectCorrelationService;

  constructor(notificationService: NotificationService, inspectCorrelationService: IInspectCorrelationService) {
    this._notificationService = notificationService;
    this._inspectCorrelationService = inspectCorrelationService;
  }

  public async processInstanceChanged(): Promise<void> {
    setTimeout(async() => {
      this.log = await this._inspectCorrelationService.getLogsForProcessInstance(this.processInstance.processModelId,
                                                                                 this.processInstance.processInstanceId,
                                                                                 this.activeSolutionEntry.identity);

      this.sortList(LogSortProperty.Time);
    }, 0);
  }

  public copyToClipboard(textToCopy: string): void {
    (clipboard as IClipboard).writeText(textToCopy);

    this._notificationService.showNotification(NotificationType.SUCCESS, 'Successfully copied to clipboard.');
  }

  public getDateStringFromTimestamp(time: string): string {
    const date: Date = new Date(time);

    const dateString: string = new DateService(date)
                                .year()
                                .month()
                                .day()
                                .hours()
                                .minutes()
                                .asFormattedDate();

    return dateString;
  }

  public sortList(property: LogSortProperty): void {
    this.sortedLog = [];
    const isSamePropertyAsPrevious: boolean = this.sortSettings.sortProperty === property;
    const ascending: boolean = isSamePropertyAsPrevious
                                ? !this.sortSettings.ascending
                                : true;

    this.sortSettings.ascending = ascending;
    this.sortSettings.sortProperty = property;

    const sortPropertyIsTime: boolean = property === LogSortProperty.Time;

    const sortedLog: Array<DataModels.Logging.LogEntry> = sortPropertyIsTime
                                        ? this._getSortedLogByDate()
                                        : this._getSortedLogByProperty(property);

    this.sortedLog = ascending
                      ? sortedLog
                      : sortedLog.reverse();
  }

  private _getSortedLogByProperty(property: LogSortProperty): Array<DataModels.Logging.LogEntry> {
    const sortedLog: Array<DataModels.Logging.LogEntry> =
      this.log.sort((firstEntry: DataModels.Logging.LogEntry, secondEntry: DataModels.Logging.LogEntry) => {
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

    return sortedLog;
  }

  private _getSortedLogByDate(): Array<DataModels.Logging.LogEntry> {
    const sortedLog: Array<DataModels.Logging.LogEntry> =
    this.log.sort((firstEntry: DataModels.Logging.LogEntry, secondEntry: DataModels.Logging.LogEntry) => {

      const firstCorrelationDate: Date = new Date(firstEntry.timeStamp);
      const secondCorrelationDate: Date = new Date(secondEntry.timeStamp);

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

    return sortedLog;
  }
}
