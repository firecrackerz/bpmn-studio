
import {inject} from 'aurelia-framework';

import {IIdentity} from '@essential-projects/iam_contracts';
import {DataModels, IManagementApi} from '@process-engine/management_api_contracts';

import {IInspectCorrelationRepository} from '../contracts';

@inject('ManagementApiClientService')
export class InspectCorrelationRepository implements IInspectCorrelationRepository {

  private _managementApiService: IManagementApi;

  constructor(managementApi: IManagementApi) {
    this._managementApiService = managementApi;
  }

  public async getAllCorrelationsForProcessModelId(processModelId: string, identity: IIdentity): Promise<Array<DataModels.Correlations.Correlation>> {
    const allCorrelations: Array<DataModels.Correlations.Correlation> = await this._managementApiService.getAllCorrelations(identity);

    const correlationsForProcessModelId: Array<DataModels.Correlations.Correlation> =
      allCorrelations.filter((correlation: DataModels.Correlations.Correlation) => {

        const processModelWithSameId: DataModels.Correlations.CorrelationProcessModel =
          correlation.processModels.find((processModel: DataModels.Correlations.CorrelationProcessModel) => {
            const isSearchedProcessModel: boolean = processModel.processModelId === processModelId;

            return isSearchedProcessModel;
          });

        const processModelFound: boolean = processModelWithSameId !== undefined;

        return processModelFound;
      });

    return correlationsForProcessModelId;
  }

  public async getLogsForCorrelation(correlation: DataModels.Correlations.Correlation,
                                     identity: IIdentity): Promise<Array<DataModels.Logging.LogEntry>> {
    const logsForAllProcessModelsOfCorrelation: Array<Array<DataModels.Logging.LogEntry>> = [];

    for (const processModel of correlation.processModels) {
      const logsForProcessModel: Array<DataModels.Logging.LogEntry> = await this._managementApiService
        .getProcessModelLog(
          identity,
          processModel.processModelId,
          correlation.id);

      logsForAllProcessModelsOfCorrelation.push(logsForProcessModel);
    }

    const logsForCorrelation: Array<DataModels.Logging.LogEntry> = [].concat(...logsForAllProcessModelsOfCorrelation);

    return logsForCorrelation;
  }

  public async getTokenForFlowNodeByProcessInstanceId(
    processInstanceId: string,
    flowNodeId: string,
    identity: IIdentity,
  ): Promise<Array<DataModels.TokenHistory.TokenHistoryEntry>> {

    return this._managementApiService.getTokensForFlowNodeByProcessInstanceId(identity, processInstanceId, flowNodeId);
  }

}
