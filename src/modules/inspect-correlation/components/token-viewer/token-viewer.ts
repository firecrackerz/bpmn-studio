import {bindable, inject} from 'aurelia-framework';

import {Correlation, TokenHistoryEntry} from '@process-engine/management_api_contracts';
import {IShape} from '../../../../contracts';
import {IInspectCorrelationService, IPayLoadEntry, ITokenEntry} from '../../contracts';

@inject('InspectCorrelationService')
export class TokenViewer {
  @bindable() public correlation: Correlation;
  @bindable() public processModelId: string;
  @bindable() public flowNode: IShape;
  @bindable() public token: string;
  public tokenEntries: Array<ITokenEntry> = [];
  public showTokenEntries: boolean = false;
  public firstElementSelected: boolean = false;
  public shouldShowFlowNodeId: boolean = false;

  private _inspectCorrelationService: IInspectCorrelationService;

  constructor(inspectCorrelationService: IInspectCorrelationService) {
    this._inspectCorrelationService = inspectCorrelationService;
  }

  public correlationChanged(newCorrelation: Correlation): void {
    const correlationWasInitiallyOpened: boolean = this.flowNode === undefined;
    if (correlationWasInitiallyOpened) {
      return;
    }

    const flowNodeIsSequenceFlow: boolean = this.flowNode.type === 'bpmn:SequenceFlow';
    if (flowNodeIsSequenceFlow) {
      this.shouldShowFlowNodeId = false;
      this.showTokenEntries = false;
      this.tokenEntries = [];

      return;
    }

    this.updateFlowNode();
  }

  public flowNodeChanged(newFlowNode: IShape): Promise<void> {
    const flowNodeIsSequenceFlow: boolean = newFlowNode.type === 'bpmn:SequenceFlow';
    if (flowNodeIsSequenceFlow) {
      this.shouldShowFlowNodeId = false;
      this.showTokenEntries = false;
      this.tokenEntries = [];

      return;
    }

    this.updateFlowNode();
  }

  public async updateFlowNode(): Promise<void> {
    this.firstElementSelected = true;
    this.tokenEntries = [];

    // Check if the selected Element can have a token.
    const elementHasNoToken: boolean = this.flowNode.type.includes('Lane')
                                    || this.flowNode.type.includes('Collaboration')
                                    || this.flowNode.type.includes('Participant');

    if (elementHasNoToken) {
      this.showTokenEntries = false;

      return;
    }

    try {
      /**
       * Currently, the backend does not offer a method to obtain all
       * flow nodes of a correlation.
       *
       * Because of this, this method will throw a 404 error when the user
       * views the ProcessToken of a flow node and then switch to a
       * correlation, where this flow node does not exists.
       *
       * TODO: As soon as the backend supports this feature, we should
       * check if the flow node that we want to access exists, to avoid 404
       * errors.
       */
      const tokenHistoryEntries: Array<TokenHistoryEntry> = await this._inspectCorrelationService
        .getTokenForFlowNodeInstance(this.processModelId, this.correlation.id, this.flowNode.id);

      tokenHistoryEntries.forEach((historyEntry: TokenHistoryEntry, index: number) => {

        const tokenEntry: ITokenEntry = {
          entryNr: index,
          eventType: historyEntry.tokenEventType,
          createdAt: historyEntry.createdAt,
          payload: [],
        };

        const historyEntryHasPayload: boolean = historyEntry.payload !== undefined;
        if (historyEntryHasPayload) {
          const payload: any = historyEntry.payload;

          const payloadIsNotAnObjectOrArray: boolean = typeof payload !== 'object';
          if (payloadIsNotAnObjectOrArray) {
            tokenEntry.payload.push({name: '0', values: [{title: '0', value: payload}]});
          } else {
            for (const loadIndex in payload) {
              const currentPayload: any = payload[loadIndex];
              const payloadEntry: IPayLoadEntry = {
                name: loadIndex,
                values: [],
              };

              const entryIsNotAnObjectOrArray: boolean = typeof currentPayload !== 'object';
              if (entryIsNotAnObjectOrArray) {
                payloadEntry.values.push({
                  title: '0',
                  value: JSON.stringify(currentPayload),
                });
              } else {
                for (const entryIndex in currentPayload) {
                  payloadEntry.values.push({
                    title: entryIndex,
                    value: JSON.stringify(currentPayload[entryIndex]),
                  });
                }
              }

              tokenEntry.payload.push(payloadEntry);
            }
          }
        }

        this.tokenEntries.push(tokenEntry);
      });

      this.showTokenEntries = true;
      this.shouldShowFlowNodeId = true;
    } catch (error) {
      this.showTokenEntries = false;
      this.shouldShowFlowNodeId = false;
    }

  }
}
