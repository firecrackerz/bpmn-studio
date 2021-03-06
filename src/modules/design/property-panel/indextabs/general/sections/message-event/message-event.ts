import {EventAggregator} from 'aurelia-event-aggregator';
import {inject} from 'aurelia-framework';

import {
  IEventElement,
  IMessage,
  IMessageEventDefinition,
  IMessageEventElement,
  IModdleElement,
  IShape,
} from '@process-engine/bpmn-elements_contracts';

import {
  IBpmnModdle,
  IBpmnModeler,
  IElementRegistry,
  ILinting,
  IPageModel,
  ISection,
} from '../../../../../../../contracts';

import environment from '../../../../../../../environment';
import {GeneralService} from '../../service/general.service';

@inject(GeneralService, EventAggregator)
export class MessageEventSection implements ISection {

  public path: string = '/sections/message-event/message-event';
  public canHandleElement: boolean = false;
  public messages: Array<IMessage>;
  public selectedId: string;
  public selectedMessage: IMessage;

  private _businessObjInPanel: IMessageEventElement;
  private _moddle: IBpmnModdle;
  private _modeler: IBpmnModeler;
  private _linter: ILinting;
  private _generalService: GeneralService;
  private _eventAggregator: EventAggregator;

  constructor(generalService?: GeneralService, eventAggregator?: EventAggregator) {
    this._generalService = generalService;
    this._eventAggregator = eventAggregator;
  }

  public async activate(model: IPageModel): Promise<void> {
    this._businessObjInPanel = model.elementInPanel.businessObject as IMessageEventElement;

    this._moddle = model.modeler.get('moddle');
    this._modeler = model.modeler;
    this._linter = model.modeler.get('linting');

    this.messages = await this._getMessages();

    this._init();
  }

  public isSuitableForElement(element: IShape): boolean {
    return this._elementIsMessageEvent(element);
  }

  public updateMessage(): void {
    this.selectedMessage = this.messages.find((message: IMessage) => {
      return message.id === this.selectedId;
    });

    const messageEventDefinition: IMessageEventDefinition = this._businessObjInPanel.eventDefinitions[0] as IMessageEventDefinition;
    messageEventDefinition.messageRef = this.selectedMessage;
    this._publishDiagramChange();

    if (this._linter.lintingActive()) {
      this._linter.update();
    }
  }

  public updateName(): void {
    const rootElements: Array<IModdleElement> = this._modeler._definitions.rootElements;
    const selectedMessage: IMessage = rootElements.find((element: IModdleElement) => {
      const elementIsSelectedMessage: boolean = element.$type === 'bpmn:Message' && element.id === this.selectedId;

      return elementIsSelectedMessage;
    });

    selectedMessage.name = this.selectedMessage.name;
    this._publishDiagramChange();
  }

  public addMessage(): void {
    const bpmnMessageProperty: {id: string, name: string} = {
      id: `Message_${this._generalService.generateRandomId()}`,
      name: 'Message Name',
    };
    const bpmnMessage: IMessage = this._moddle.create('bpmn:Message', bpmnMessageProperty);

    this._modeler._definitions.rootElements.push(bpmnMessage);

    this._moddle.toXML(this._modeler._definitions.rootElements, (toXMLError: Error, xmlStrUpdated: string) => {
      this._modeler.importXML(xmlStrUpdated, async(importXMLError: Error) => {
        await this._refreshMessages();
        await this._setBusinessObj();

        this.selectedId = bpmnMessage.id;
        this.updateMessage();
      });
    });
    this._publishDiagramChange();
  }

  public removeSelectedMessage(): void {
    const noMessageIsSelected: boolean = !this.selectedId;
    if (noMessageIsSelected) {
      return;
    }

    const messageIndex: number = this.messages.findIndex((message: IMessage) => {
      return message.id === this.selectedId;
    });

    this.messages.splice(messageIndex, 1);
    this._modeler._definitions.rootElements.splice(this._getRootElementsIndex(this.selectedId), 1);

    this.updateMessage();
    this._publishDiagramChange();
  }

  private _getRootElementsIndex(elementId: string): number {
    const rootElements: Array<IModdleElement> = this._modeler._definitions.rootElements;

    const rootElementsIndex: number = rootElements.findIndex((element: IModdleElement) => {
      return element.id === elementId;
    });

    return rootElementsIndex;
  }

  private _elementIsMessageEvent(element: IShape): boolean {
    const elementHasNoBusinessObject: boolean = element === undefined || element.businessObject === undefined;
    if (elementHasNoBusinessObject) {
      return false;
    }

    const eventElement: IEventElement = element.businessObject as IEventElement;

    const elementIsMessageEvent: boolean = eventElement.eventDefinitions !== undefined
                                        && eventElement.eventDefinitions[0] !== undefined
                                        && eventElement.eventDefinitions[0].$type === 'bpmn:MessageEventDefinition';

    return elementIsMessageEvent;
  }

  private _init(): void {
    const eventDefinitions: Array<IMessageEventDefinition> = this._businessObjInPanel.eventDefinitions;
    const businessObjectHasNoMessageEvents: boolean = eventDefinitions === undefined
                                                   || eventDefinitions === null
                                                   || eventDefinitions[0].$type !== 'bpmn:MessageEventDefinition';
    if (businessObjectHasNoMessageEvents) {
      return;
    }

    const messageEventDefinition: IMessageEventDefinition = this._businessObjInPanel.eventDefinitions[0];
    const elementHasNoMessageRef: boolean = messageEventDefinition.messageRef === undefined;

    if (elementHasNoMessageRef) {
      this.selectedMessage = null;
      this.selectedId = null;

      return;
    }

    const messageRefId: string = messageEventDefinition.messageRef.id;
    const elementReferencesMessage: boolean = this._getMessageById(messageRefId) !== undefined;

    if (elementReferencesMessage) {
      this.selectedId = messageRefId;

      this.selectedMessage = this.messages.find((message: IMessage) => {
        return message.id === this.selectedId;
      });

    } else {
      this.selectedMessage = undefined;
      this.selectedId = undefined;
    }
  }

  private _getMessageById(messageId: string): IMessage {
    const messages: Array<IMessage> = this._getMessages();
    const message: IMessage = messages.find((messageElement: IMessage) => {
      return messageElement.id === messageId;
    });

    return message;
  }

  private _getMessages(): Array<IMessage> {
    const rootElements: Array<IModdleElement> = this._modeler._definitions.rootElements;
    const messages: Array<IMessage> = rootElements.filter((element: IModdleElement) => {
      return element.$type === 'bpmn:Message';
    });

    return messages;
  }

  private async _refreshMessages(): Promise<void> {
    this.messages = await this._getMessages();
  }

  private _setBusinessObj(): void {
    const elementRegistry: IElementRegistry = this._modeler.get('elementRegistry');
    const elementInPanel: IShape = elementRegistry.get(this._businessObjInPanel.id);

    this._businessObjInPanel = elementInPanel.businessObject as IMessageEventElement;
  }

  private _publishDiagramChange(): void {
    this._eventAggregator.publish(environment.events.diagramChange);
  }
}
