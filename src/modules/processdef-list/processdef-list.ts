import {IProcessDefEntity} from '@process-engine/process_engine_contracts';
import {EventAggregator, Subscription} from 'aurelia-event-aggregator';
import {inject} from 'aurelia-framework';
import {AuthenticationStateEvent, IPagination, IProcessEngineService} from '../../contracts/index';
import environment from '../../environment';

@inject('ProcessEngineService', EventAggregator)
export class ProcessDefList {

  private processEngineService: IProcessEngineService;
  private eventAggregator: EventAggregator;

  private offset: number;
  private _processes: IPagination<IProcessDefEntity>;
  private getProcessesIntervalId: number;
  private createProcess: string = environment.createProcess;
  private subscriptions: Array<Subscription>;

  constructor(processEngineService: IProcessEngineService, eventAggregator: EventAggregator) {
    this.processEngineService = processEngineService;
    this.eventAggregator = eventAggregator;
  }

  public async getProcessesFromService(offset: number): Promise<void> {
    this._processes = await this.processEngineService.getProcessDefs(environment.processlist.pageLimit, offset);
  }

  public activate(routeParameters: {page: number}): void {
    const page: number = routeParameters.page || 1;
    this.offset = (page - 1) * environment.processlist.pageLimit;
    this.getProcessesFromService(this.offset);
  }

  public attached(): void {
    this.getProcessesIntervalId = window.setInterval(() => {
      this.getProcessesFromService(this.offset);
      // tslint:disable-next-line
    }, environment.processengine.poolingInterval);

    this.subscriptions = [
      this.eventAggregator.subscribe(AuthenticationStateEvent.LOGIN, () => {
        this.refreshProcesslist();
      }),
      this.eventAggregator.subscribe(AuthenticationStateEvent.LOGOUT, () => {
        this.refreshProcesslist();
      }),
    ];
  }

  public detached(): void {
    clearInterval(this.getProcessesIntervalId);
    for (const subscription of this.subscriptions) {
      subscription.dispose();
    }
  }

  private refreshProcesslist(): void {
    this.getProcessesFromService(this.offset);
  }

  public get limit(): number {
    if (this._processes === undefined) {
      return 0;
    }
    return this._processes.limit;
  }

  public get maxPages(): number {
    if (this._processes === undefined) {
      return 0;
    }
    return Math.ceil(this._processes.count / this._processes.limit);
  }

  public get currentPage(): number {
    if (this._processes === undefined) {
      return 0;
    }
    return this.offset / this._processes.limit + 1;
  }

  public get processes(): Array<IProcessDefEntity> {
    if (this._processes === undefined) {
      return [];
    }
    return this._processes.data;
  }
}
