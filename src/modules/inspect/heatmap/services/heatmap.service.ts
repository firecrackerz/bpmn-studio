import {inject} from 'aurelia-framework';

import {IIdentity} from '@essential-projects/iam_contracts';
import {IConnection, IShape} from '@process-engine/bpmn-elements_contracts';
import {ActiveToken, FlowNodeRuntimeInformation} from '@process-engine/kpi_api_contracts';
import {DataModels} from '@process-engine/management_api_contracts';

import {
  defaultBpmnColors,
  IBpmnModeler,
  IColorPickerColor,
  IElementRegistry,
  IModeling,
  IOverlayManager,
  IOverlayPosition,
} from '../../../../contracts/index';
import {
  defaultOverlayPositions,
  IFlowNodeAssociation,
  IHeatmapRepository,
  IHeatmapService,
  ITokenPositionAndCount,
} from '../contracts/index';

// maximalTokenCount is used to sanitise the displayed number to "99+"
const maximalTokenCount: number = 100;

@inject('HeatmapRepository')
export class HeatmapService implements IHeatmapService {
  private _heatmapRepository: IHeatmapRepository;

  constructor(heatmapRepository: IHeatmapRepository) {
    this._heatmapRepository = heatmapRepository;
  }

  public setIdentity(identity: IIdentity): void {
    this._heatmapRepository.setIdentity(identity);
  }

  public getRuntimeInformationForProcessModel(processModelId: string): Promise<Array<FlowNodeRuntimeInformation>> {
    return this._heatmapRepository.getRuntimeInformationForProcessModel(processModelId);
  }

  public getActiveTokensForFlowNode(flowNodeId: string): Promise<Array<ActiveToken>> {
    return this._heatmapRepository.getActiveTokensForFlowNode(flowNodeId);
  }

  /**
   *
   * @param overlays IOverlayManager; The overlay module from bpmn-js
   * @param elementRegistry IElementRegistry; The elementRegistry module from bpmn-js
   *
   * This method adds overlays for the activeTokens to the diagram viewer.
   */
  public async addOverlays(overlays: IOverlayManager, elementRegistry: IElementRegistry, processModelId: string): Promise<void> {

    let participantsTokenCount: number = 0;

    const addOverlay: ((elementId: string, count: number, position: IOverlayPosition) => void ) =
      ((elementId: string, count: number, position: IOverlayPosition): void => {

        const countIsTooHigh: boolean = count >=  maximalTokenCount;

        overlays.add(elementId, {
          position: {
            left: position.left,
            top: position.top,
          },
          html: `<div class="heatmap__overlay" title="This element has actual ${count} token.">${countIsTooHigh ? '99+' : count}</div>`,
        });
      });

    const elementsForOverlays: Array<IShape> = this._getElementsForOverlays(elementRegistry);
    const activeTokenListArray: Array<Array<ActiveToken>> = await this._getActiveTokenListArray(elementsForOverlays, processModelId);

    this._addShapeTypeToActiveToken(activeTokenListArray, elementsForOverlays);

    const elementsWithoutToken: Array<IShape> = this._getElementsWithoutToken(elementsForOverlays, activeTokenListArray);

    activeTokenListArray.forEach((activeTokenArray: Array<ActiveToken & { type: string }>) => {
      const elementIsEvent: boolean = this._elementIsEvent(activeTokenArray[0].type);
      const elementIsGateway: boolean = this._elementIsGateway(activeTokenArray[0].type);
      const elementIsTask: boolean = this._elementIsTask(activeTokenArray[0].type);

      if (elementIsGateway) {
        addOverlay(activeTokenArray[0].flowNodeId, activeTokenArray.length, defaultOverlayPositions.gateways);
      } else if (elementIsEvent) {
        addOverlay(activeTokenArray[0].flowNodeId, activeTokenArray.length, defaultOverlayPositions.events);
      } else if (elementIsTask) {
        addOverlay(activeTokenArray[0].flowNodeId, activeTokenArray.length, defaultOverlayPositions.tasks);
      }

      participantsTokenCount += activeTokenArray.length;
    });

    elementsWithoutToken.forEach((element: IShape) => {
      const elementIsEvent: boolean = this._elementIsEvent(element.type);
      const elementIsGateway: boolean = this._elementIsGateway(element.type);
      const elementIsTask: boolean = this._elementIsTask(element.type);

      if (elementIsGateway) {
        addOverlay(element.id, 0, defaultOverlayPositions.gateways);
      } else if (elementIsEvent) {
        addOverlay(element.id, 0, defaultOverlayPositions.events);
      } else if (elementIsTask) {
        addOverlay(element.id, 0, defaultOverlayPositions.tasks);
      }
    });

    const participantShape: IShape = this._getParticipantShape(elementRegistry);
    addOverlay(participantShape.id, participantsTokenCount, {
      left: participantShape.width - defaultOverlayPositions.participants.left,
      top: participantShape.height - defaultOverlayPositions.participants.top,
    });
  }

  public getProcess(processModelId: string): Promise<DataModels.ProcessModels.ProcessModel> {
    return this._heatmapRepository.getProcess(processModelId);
  }

  /**
   *
   * @param elementRegistry IElementRegistry; The elementRegistry module from bpmn-js
   *
   * This method finds all associations (IConnection) on flowNodes which are defined with 'RT:'
   * and returns them as IFlowNodeAssociation.
   *
   * A flowNodeAssociation contains the associationId, the elementId with which
   * it is connected and the expected runtime.
   *
   */
  public getFlowNodeAssociations(elementRegistry: IElementRegistry): Array<IFlowNodeAssociation> {

    const flowNodeAssociations: Array<IFlowNodeAssociation> = [];

    const associations: Array<IConnection> = elementRegistry.filter((element: IShape) => {
      const elementIsNoValidAssociation: boolean = element.target === undefined ||
                                                   element.target.businessObject === undefined ||
                                                   element.target.businessObject.text === undefined;

      if (elementIsNoValidAssociation) {
        return false;
      }

      const elementIsAssociation: boolean = element.type === 'bpmn:Association';
      const annotationHasRuntime: boolean = element.target.businessObject.text.includes('RT:');

      return elementIsAssociation && annotationHasRuntime;
    });

    associations.forEach((association: IConnection) => {

      const medianRunTime: number = this._getMedianRunTimeForAssociation(association);

      const flowNodeAssociation: IFlowNodeAssociation = {
        associationId: association.id,
        sourceId: association.source.id,
        runtime_medianInMs: medianRunTime,
      };

      flowNodeAssociations.push(flowNodeAssociation);
    });

    return flowNodeAssociations;
  }

  /**
   *
   * @param associations Array<IFlowNodeAssociation>;
   * @param flowNodeRuntimeInformation Array<FlowNodeRuntimeInformation>; RuntimeInformation which comes from the backend.
   * @param modeler IBpmnModeler; The bpmn-js diagram modeler (only the modeler can color elements).
   *
   * Checks if the runtime for a flowNode is greater than expected and colors the element
   * depending on the result.
   *
   * greater => red
   * smaller => green
   *
   */
  public async getColoredXML(
    associations: Array<IFlowNodeAssociation>,
    flowNodeRuntimeInformation: Array<FlowNodeRuntimeInformation>,
    modeler: IBpmnModeler,
  ): Promise<string> {
    const elementRegistry: IElementRegistry = modeler.get('elementRegistry');
    const modeling: IModeling = modeler.get('modeling');

    const elementsToColor: Array<FlowNodeRuntimeInformation> = this._getElementsToColor(associations, flowNodeRuntimeInformation);

    associations.forEach((association: IFlowNodeAssociation) => {
      const elementToColor: FlowNodeRuntimeInformation =  elementsToColor.find((element: FlowNodeRuntimeInformation) => {
        return element.flowNodeId === association.sourceId;
      });

      const elementToColorIsUndefined: boolean = elementToColor === undefined;

      if (elementToColorIsUndefined) {
        return;
      }

      const shapeToColor: IShape = this._getShape(elementRegistry, elementToColor);
      const flowNodeRuntimeIsGreaterThanExpected: boolean = elementToColor.medianRuntimeInMs > association.runtime_medianInMs;

      if (flowNodeRuntimeIsGreaterThanExpected) {
        this.colorElement(modeling, shapeToColor, defaultBpmnColors.red);
      } else {
        this.colorElement(modeling, shapeToColor, defaultBpmnColors.green);
      }

    });

    const xml: string = await this._getXmlFromModeler(modeler);

    return xml;
  }

  private colorElement(modeling: IModeling, shapeToColor: IShape, color: IColorPickerColor): void {
    modeling.setColor(shapeToColor, {
      stroke: color.border,
      fill: color.fill,
    });
  }

  /**
   *
   * @param associations Array<IFlowNodeAssociation>; Expected runtime information.
   * @param flowNodeRuntimeInformation Array<FlowNodeRuntimeInformation>; RuntimeInformation which comes from the backend.
   *
   * Returns the flowNodeRuntimeInformation from the elements which must get colored.
   */
  private _getElementsToColor(
    associations: Array<IFlowNodeAssociation>,
    flowNodeRuntimeInformation: Array<FlowNodeRuntimeInformation>,
  ): Array<FlowNodeRuntimeInformation> {

    const elementsToColor: Array<FlowNodeRuntimeInformation> = flowNodeRuntimeInformation.filter((information: FlowNodeRuntimeInformation) => {
      const associationWithSameId: IFlowNodeAssociation = associations.find((association: IFlowNodeAssociation) => {
        return association.sourceId === information.flowNodeId;
      });

      return associationWithSameId;
    });

    return elementsToColor;
  }

  /**
   *
   * @param elementRegistry IElementRegistry;
   * @param elementToColor FlowNodeRuntimeInformation | ITokenPositionAndCount | ActiveToken;
   *
   * Returns the IShape of an element.
   * The IShape is needed by the IModeling module from bpmn-js to color an element.
   */
  private _getShape(elementRegistry: IElementRegistry, elementToColor: FlowNodeRuntimeInformation | ITokenPositionAndCount | ActiveToken): IShape {
    const elementShape: IShape = elementRegistry.get(elementToColor.flowNodeId);

    return elementShape;
  }

  private _getParticipantShape(elementRegistry: IElementRegistry): IShape {
    const allElements: Array<IShape> = elementRegistry.getAll();

    const participantShape: IShape = allElements.find((element: IShape) => {
      const elementIsParticipant: boolean = element.type === 'bpmn:Participant';

      return elementIsParticipant;
    });

    return participantShape;
  }

  private _getElementsForOverlays(elementRegistry: IElementRegistry): Array<IShape> {
    const allElements: Array<IShape> = elementRegistry.getAll();
    const filteredElements: Array<IShape> = allElements.filter((element: IShape) => {
      const condition: boolean = element.type !== 'bpmn:Association'
                              && element.type !== 'bpmn:SequenceFlow'
                              && element.type !== 'bpmn:TextAnnotation'
                              && element.type !== 'bpmn:Participant'
                              && element.type !== 'bpmn:Collaboration'
                              && element.type !== 'bpmn:Lane'
                              && element.type !== 'label';

      return condition;
    });

    return filteredElements;
  }

  private async _getXmlFromModeler(modeler: IBpmnModeler): Promise<string> {
    const saveXmlPromise: Promise<string> = new Promise((resolve: Function, reject: Function): void =>  {
      modeler.saveXML({format: true}, async(saveXmlError: Error, xml: string) => {
        if (saveXmlError) {
          reject(saveXmlError);

          return;
        }

        resolve(xml);
      });
    });

    return saveXmlPromise;
  }

  private _getMedianRunTimeForAssociation(association: IConnection): number {
    const annotationText: string = association.target.businessObject.text;
    const lengthOfRTStamp: number = 4;
    const startRunTimeText: number = annotationText.search('RT:') + lengthOfRTStamp;
    const lengthOfRunTimeText: number = 12;
    const runTimeTimeStamp: string = annotationText.substr(startRunTimeText, lengthOfRunTimeText);
    const date: Date = new Date('1970-01-01T' + runTimeTimeStamp + 'Z');
    const medianRunTimeInMs: number = date.getTime();

    return medianRunTimeInMs;
  }

  private async _getActiveTokenListArray(elementsForOverlays: Array<IShape>, processModelId: string): Promise<Array<Array<ActiveToken>>> {
    const promisesForElements: Array<Promise<Array<ActiveToken>>> = elementsForOverlays.map(async(element: IShape) => {
      const elementsActiveTokens: Array<ActiveToken> = await this.getActiveTokensForFlowNode(element.id);

      const elementActiveTokensForProcessModel: Array<ActiveToken> = elementsActiveTokens.filter((token: ActiveToken) => {
        const tokenIsInProcessModel: boolean = token.processModelId === processModelId;

        return tokenIsInProcessModel;
      });

      return elementActiveTokensForProcessModel;
    });

    const activeTokenListArrayForAllElements: Array<Array<ActiveToken>> = await Promise.all(promisesForElements);

    const filteredActiveTokenListArray: Array<Array<ActiveToken>> = activeTokenListArrayForAllElements.filter((element: Array<ActiveToken>) => {
      const arrayIsEmpty: boolean = element.length !== 0;

      return arrayIsEmpty;
    });

    return filteredActiveTokenListArray;
  }

  private _addShapeTypeToActiveToken(activeTokenListArray: Array<Array<ActiveToken>>, elementsForOverlays: Array<IShape>): void {
    activeTokenListArray.forEach((activeTokenArray: Array<ActiveToken & { type: string }>) => {
      const elementOfActiveToken: IShape = elementsForOverlays.find((element: IShape) => {
        const isCorrectElement: boolean = element.id === activeTokenArray[0].flowNodeId;

        return isCorrectElement;
      });

      activeTokenArray[0].type = elementOfActiveToken.type;
    });
  }

  private _getElementsWithoutToken(elementsForOverlays: Array<IShape>, activeTokenListArray: Array<Array<ActiveToken>>): Array<IShape> {
    const elementsWithoutToken: Array<IShape> = elementsForOverlays.filter((element: IShape) => {
      const activeTokenForElement: Array<ActiveToken> = activeTokenListArray.find((activeTokenArray: Array<ActiveToken>) => {
        return activeTokenArray[0].flowNodeId === element.id;
      });

      const noActiveTokenForElement: boolean = activeTokenForElement === undefined;

      return noActiveTokenForElement;
    });

    return elementsWithoutToken;
  }

  private _elementIsEvent(type: string): boolean {
    const elementTypeIsEvent: boolean = type === 'bpmn:StartEvent'
                                     || type === 'bpmn:EndEvent'
                                     || type === 'bpmn:IntermediateThrowEvent'
                                     || type === 'bpmn:IntermediateCatchEvent'
                                     || type === 'bpmn:BoundaryEvent';

    return elementTypeIsEvent;
  }

  private _elementIsGateway(type: string): boolean {
    const elementTypeIsGateway: boolean = type === 'bpmn:ExclusiveGateway'
                                       || type === 'bpmn:ParallelGateway'
                                       || type === 'bpmn:InclusiveGateway'
                                       || type === 'bpmn:ComplexGateway'
                                       || type === 'bpmn:EventBasedGateway';

    return elementTypeIsGateway;
  }

  private _elementIsTask(type: string): boolean {
    const elementTypeIsTask: boolean = type === 'bpmn:UserTask'
                                    || type === 'bpmn:ScriptTask'
                                    || type === 'bpmn:ServiceTask'
                                    || type === 'bpmn:Task'
                                    || type === 'bpmn:SendTask'
                                    || type === 'bpmn:ReceiveTask'
                                    || type === 'bpmn:ManualTask'
                                    || type === 'bpmn:BusinessRuleTask'
                                    || type === 'bpmn:CallActivity'
                                    || type === 'bpmn:SubProcess';

    return elementTypeIsTask;
  }

}
