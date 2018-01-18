import {IBpmnModeler,
  IBpmnModelerConstructor,
  IEvent,
  IEventBus,
  IModdleElement,
  IModeling,
  IPageModel,
  ISection,
  IShape} from '../../../../../../contracts';

export class BasicsSection implements ISection {

  public path: string = '/sections/basics/basics';
  public canHandleElement: boolean = true;

  private elementInPanel: IShape;
  private businessObjInPanel: IModdleElement;
  private eventBus: IEventBus;
  private modeling: IModeling;

  public activate(model: IPageModel): void {
    this.eventBus = model.modeler.get('eventBus');
    this.modeling = model.modeler.get('modeling');

    this.eventBus.on('element.click', (event: IEvent) => {
      this.elementInPanel = event.element;
      this.businessObjInPanel = event.element.businessObject;
      console.log(this.businessObjInPanel);
    });
  }

  private updateName(): void {
    this.modeling.updateProperties(this.elementInPanel, {
      name: this.businessObjInPanel.name,
    });
  }

  private updateId(): void {
    this.modeling.updateProperties(this.elementInPanel, {
      id: this.businessObjInPanel.id,
    });
  }

  private updateDocumentation(): void {
    this.modeling.updateProperties(this.elementInPanel, {
      documentation: this.businessObjInPanel.documentation,
    });
  }

}
