import {browser} from 'protractor';
import {HttpClient} from 'protractor-http-client';

import {IRequestHeaders, IRequestPayload} from '../contracts/index';

export class LETTestDiagram {
    public name: string =  'let_test';
    public userTaskId: string = 'Task_1yftx0l';
    public manualTaskId: string = 'Task_0u4cnp4';
    public callActivityId: string = 'Task_0f8akhm';
    public emptyActivityId: string = 'Task_064hsv6';
    public correlationId: string;
    public processInstanceId: string;
    public userTaskDynamicUiUrl: string;

    public callActivityTargetDiagramId: string;

    // Define Instances
    private _processEngineUrl: string = browser.params.processEngineUrl;
    private _http: HttpClient = new HttpClient(this._processEngineUrl);
    private _applicationUrl: string = browser.params.aureliaUrl;
    private _processEngineActionTimeout: number = browser.params.processEngineActionTimeout;

    constructor(callActivityTargetDiagramId: string) {
      this.callActivityTargetDiagramId = callActivityTargetDiagramId;
    }

    public async deployDiagram(): Promise<void> {
      const requestDestination: string = `/api/management/v1/process_models/${this.name}/update`;
      const requestPayload: IRequestPayload = {
        xml: `<?xml version="1.0" encoding="UTF-8"?>
        <bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                          xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                          xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                          xmlns:camunda="http://camunda.org/schema/1.0/bpmn"
                          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                          xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                          id="Definition_1" targetNamespace="http://bpmn.io/schema/bpmn"
                          exporter="Camunda Modeler" exporterVersion="1.11.3">
          <bpmn:collaboration id="Collaboration_1cidyxu" name="">
            <bpmn:extensionElements>
              <camunda:formData />
            </bpmn:extensionElements>
            <bpmn:participant id="Participant_0px403d" name="let_test" processRef="let_test" />
          </bpmn:collaboration>
          <bpmn:process id="let_test" name="let_test" isExecutable="true">
            <bpmn:laneSet>
              <bpmn:lane id="Lane_1xzf0d3" name="Lane">
                <bpmn:extensionElements>
                  <camunda:formData />
                </bpmn:extensionElements>
                <bpmn:flowNodeRef>StartEvent_1mox3jl</bpmn:flowNodeRef>
                <bpmn:flowNodeRef>ExclusiveGateway_1nujyjh</bpmn:flowNodeRef>
                <bpmn:flowNodeRef>Task_1yftx0l</bpmn:flowNodeRef>
                <bpmn:flowNodeRef>ExclusiveGateway_033l1q7</bpmn:flowNodeRef>
                <bpmn:flowNodeRef>Task_0u4cnp4</bpmn:flowNodeRef>
                <bpmn:flowNodeRef>Task_064hsv6</bpmn:flowNodeRef>
                <bpmn:flowNodeRef>EndEvent_0eie6q6</bpmn:flowNodeRef>
                <bpmn:flowNodeRef>Task_0f8akhm</bpmn:flowNodeRef>
                <bpmn:flowNodeRef>Task_1wba5if</bpmn:flowNodeRef>
              </bpmn:lane>
            </bpmn:laneSet>
            <bpmn:sequenceFlow id="SequenceFlow_0equnaa" sourceRef="Task_0f8akhm" targetRef="ExclusiveGateway_033l1q7" />
            <bpmn:sequenceFlow id="SequenceFlow_1b6zaue" sourceRef="ExclusiveGateway_033l1q7" targetRef="EndEvent_0eie6q6" />
            <bpmn:sequenceFlow id="SequenceFlow_0z1d7lk" sourceRef="ExclusiveGateway_1nujyjh" targetRef="Task_0u4cnp4" />
            <bpmn:sequenceFlow id="SequenceFlow_012lf31" sourceRef="ExclusiveGateway_1nujyjh" targetRef="Task_064hsv6" />
            <bpmn:sequenceFlow id="SequenceFlow_04oukte" sourceRef="Task_0u4cnp4" targetRef="ExclusiveGateway_033l1q7" />
            <bpmn:sequenceFlow id="SequenceFlow_03ptk9b" sourceRef="Task_064hsv6" targetRef="ExclusiveGateway_033l1q7" />
            <bpmn:sequenceFlow id="SequenceFlow_0mrk81n" sourceRef="ExclusiveGateway_1nujyjh" targetRef="Task_1yftx0l" />
            <bpmn:sequenceFlow id="SequenceFlow_0zfh1ld" sourceRef="Task_1yftx0l" targetRef="ExclusiveGateway_033l1q7" />
            <bpmn:startEvent id="StartEvent_1mox3jl" name="Start Event">
              <bpmn:outgoing>SequenceFlow_1gnfgy8</bpmn:outgoing>
            </bpmn:startEvent>
            <bpmn:parallelGateway id="ExclusiveGateway_1nujyjh" name="">
              <bpmn:incoming>SequenceFlow_1gnfgy8</bpmn:incoming>
              <bpmn:outgoing>SequenceFlow_0z1d7lk</bpmn:outgoing>
              <bpmn:outgoing>SequenceFlow_012lf31</bpmn:outgoing>
              <bpmn:outgoing>SequenceFlow_0mrk81n</bpmn:outgoing>
              <bpmn:outgoing>SequenceFlow_0xz3tyu</bpmn:outgoing>
            </bpmn:parallelGateway>
            <bpmn:userTask id="Task_1yftx0l" name="User Task" camunda:formKey="Form Key">
              <bpmn:extensionElements>
                <camunda:formData />
              </bpmn:extensionElements>
              <bpmn:incoming>SequenceFlow_0mrk81n</bpmn:incoming>
              <bpmn:outgoing>SequenceFlow_0zfh1ld</bpmn:outgoing>
            </bpmn:userTask>
            <bpmn:parallelGateway id="ExclusiveGateway_033l1q7" name="">
              <bpmn:extensionElements>
                <camunda:formData />
              </bpmn:extensionElements>
              <bpmn:incoming>SequenceFlow_0equnaa</bpmn:incoming>
              <bpmn:incoming>SequenceFlow_04oukte</bpmn:incoming>
              <bpmn:incoming>SequenceFlow_03ptk9b</bpmn:incoming>
              <bpmn:incoming>SequenceFlow_0zfh1ld</bpmn:incoming>
              <bpmn:outgoing>SequenceFlow_1b6zaue</bpmn:outgoing>
            </bpmn:parallelGateway>
            <bpmn:manualTask id="Task_0u4cnp4" name="ManualTask">
              <bpmn:incoming>SequenceFlow_0z1d7lk</bpmn:incoming>
              <bpmn:outgoing>SequenceFlow_04oukte</bpmn:outgoing>
            </bpmn:manualTask>
            <bpmn:task id="Task_064hsv6" name="Empty Task">
              <bpmn:incoming>SequenceFlow_012lf31</bpmn:incoming>
              <bpmn:outgoing>SequenceFlow_03ptk9b</bpmn:outgoing>
            </bpmn:task>
            <bpmn:endEvent id="EndEvent_0eie6q6" name="End Event">
              <bpmn:extensionElements>
                <camunda:formData />
              </bpmn:extensionElements>
              <bpmn:incoming>SequenceFlow_1b6zaue</bpmn:incoming>
            </bpmn:endEvent>
            <bpmn:sequenceFlow id="SequenceFlow_1gnfgy8" sourceRef="StartEvent_1mox3jl" targetRef="ExclusiveGateway_1nujyjh" />
            <bpmn:callActivity id="Task_0f8akhm" name="CallAcitivity" calledElement="${this.callActivityTargetDiagramId}">
              <bpmn:extensionElements>
                <camunda:formData />
              </bpmn:extensionElements>
              <bpmn:incoming>SequenceFlow_13bmeft</bpmn:incoming>
              <bpmn:outgoing>SequenceFlow_0equnaa</bpmn:outgoing>
            </bpmn:callActivity>
            <bpmn:task id="Task_1wba5if">
              <bpmn:incoming>SequenceFlow_0xz3tyu</bpmn:incoming>
              <bpmn:outgoing>SequenceFlow_13bmeft</bpmn:outgoing>
            </bpmn:task>
            <bpmn:sequenceFlow id="SequenceFlow_13bmeft" sourceRef="Task_1wba5if" targetRef="Task_0f8akhm" />
            <bpmn:sequenceFlow id="SequenceFlow_0xz3tyu" sourceRef="ExclusiveGateway_1nujyjh" targetRef="Task_1wba5if" />
          </bpmn:process>
          <bpmndi:BPMNDiagram id="BPMNDiagram_1">
            <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Collaboration_1cidyxu">
              <bpmndi:BPMNShape id="Participant_0px403d_di" bpmnElement="Participant_0px403d">
                <dc:Bounds x="-966" y="-184" width="956" height="668" />
              </bpmndi:BPMNShape>
              <bpmndi:BPMNShape id="Lane_1xzf0d3_di" bpmnElement="Lane_1xzf0d3">
                <dc:Bounds x="-936" y="-184" width="926" height="668" />
              </bpmndi:BPMNShape>
              <bpmndi:BPMNShape id="StartEvent_1mox3jl_di" bpmnElement="StartEvent_1mox3jl">
                <dc:Bounds x="-824" y="-73" width="36" height="36" />
                <bpmndi:BPMNLabel>
                  <dc:Bounds x="-833" y="-37" width="55" height="14" />
                </bpmndi:BPMNLabel>
              </bpmndi:BPMNShape>
              <bpmndi:BPMNShape id="EndEvent_0eie6q6_di" bpmnElement="EndEvent_0eie6q6">
                <dc:Bounds x="-106" y="-73" width="36" height="36" />
                <bpmndi:BPMNLabel>
                  <dc:Bounds x="-113" y="-37" width="51" height="14" />
                </bpmndi:BPMNLabel>
              </bpmndi:BPMNShape>
              <bpmndi:BPMNShape id="ManualTask_0srbuuw_di" bpmnElement="Task_0u4cnp4">
                <dc:Bounds x="-518" y="195" width="100" height="80" />
              </bpmndi:BPMNShape>
              <bpmndi:BPMNShape id="ParallelGateway_01i3xmw_di" bpmnElement="ExclusiveGateway_1nujyjh">
                <dc:Bounds x="-663" y="-80" width="50" height="50" />
                <bpmndi:BPMNLabel>
                  <dc:Bounds x="174" y="112" width="90" height="20" />
                </bpmndi:BPMNLabel>
              </bpmndi:BPMNShape>
              <bpmndi:BPMNShape id="CallActivity_097qa7j_di" bpmnElement="Task_0f8akhm">
                <dc:Bounds x="-418" y="47" width="100" height="80" />
              </bpmndi:BPMNShape>
              <bpmndi:BPMNEdge id="SequenceFlow_0equnaa_di" bpmnElement="SequenceFlow_0equnaa">
                <di:waypoint x="-318" y="87" />
                <di:waypoint x="-272" y="87" />
                <di:waypoint x="-272" y="-30" />
              </bpmndi:BPMNEdge>
              <bpmndi:BPMNEdge id="SequenceFlow_1b6zaue_di" bpmnElement="SequenceFlow_1b6zaue">
                <di:waypoint x="-247" y="-55" />
                <di:waypoint x="-106" y="-55" />
              </bpmndi:BPMNEdge>
              <bpmndi:BPMNShape id="ParallelGateway_0dry6w1_di" bpmnElement="ExclusiveGateway_033l1q7">
                <dc:Bounds x="-297" y="-80" width="50" height="50" />
              </bpmndi:BPMNShape>
              <bpmndi:BPMNShape id="Task_064hsv6_di" bpmnElement="Task_064hsv6">
                <dc:Bounds x="-518" y="336" width="100" height="80" />
              </bpmndi:BPMNShape>
              <bpmndi:BPMNEdge id="SequenceFlow_0z1d7lk_di" bpmnElement="SequenceFlow_0z1d7lk">
                <di:waypoint x="-638" y="-30" />
                <di:waypoint x="-638" y="235" />
                <di:waypoint x="-518" y="235" />
                <bpmndi:BPMNLabel>
                  <dc:Bounds x="234" y="202.5" width="0" height="13" />
                </bpmndi:BPMNLabel>
              </bpmndi:BPMNEdge>
              <bpmndi:BPMNEdge id="SequenceFlow_012lf31_di" bpmnElement="SequenceFlow_012lf31">
                <di:waypoint x="-638" y="-30" />
                <di:waypoint x="-638" y="376" />
                <di:waypoint x="-518" y="376" />
                <bpmndi:BPMNLabel>
                  <dc:Bounds x="234" y="254.5" width="0" height="13" />
                </bpmndi:BPMNLabel>
              </bpmndi:BPMNEdge>
              <bpmndi:BPMNEdge id="SequenceFlow_04oukte_di" bpmnElement="SequenceFlow_04oukte">
                <di:waypoint x="-418" y="235" />
                <di:waypoint x="-272" y="235" />
                <di:waypoint x="-272" y="-30" />
                <bpmndi:BPMNLabel>
                  <dc:Bounds x="514.5" y="285" width="0" height="13" />
                </bpmndi:BPMNLabel>
              </bpmndi:BPMNEdge>
              <bpmndi:BPMNEdge id="SequenceFlow_03ptk9b_di" bpmnElement="SequenceFlow_03ptk9b">
                <di:waypoint x="-418" y="376" />
                <di:waypoint x="-272" y="376" />
                <di:waypoint x="-272" y="-30" />
                <bpmndi:BPMNLabel>
                  <dc:Bounds x="514.5" y="389" width="0" height="13" />
                </bpmndi:BPMNLabel>
              </bpmndi:BPMNEdge>
              <bpmndi:BPMNEdge id="SequenceFlow_0mrk81n_di" bpmnElement="SequenceFlow_0mrk81n">
                <di:waypoint x="-613" y="-55" />
                <di:waypoint x="-518" y="-55" />
                <bpmndi:BPMNLabel>
                  <dc:Bounds x="286.5" y="65" width="0" height="13" />
                </bpmndi:BPMNLabel>
              </bpmndi:BPMNEdge>
              <bpmndi:BPMNEdge id="SequenceFlow_0zfh1ld_di" bpmnElement="SequenceFlow_0zfh1ld">
                <di:waypoint x="-418" y="-55" />
                <di:waypoint x="-297" y="-55" />
                <bpmndi:BPMNLabel>
                  <dc:Bounds x="474.5" y="65" width="0" height="13" />
                </bpmndi:BPMNLabel>
              </bpmndi:BPMNEdge>
              <bpmndi:BPMNShape id="UserTask_0tf7jnb_di" bpmnElement="Task_1yftx0l">
                <dc:Bounds x="-518" y="-95" width="100" height="80" />
              </bpmndi:BPMNShape>
              <bpmndi:BPMNEdge id="SequenceFlow_1gnfgy8_di" bpmnElement="SequenceFlow_1gnfgy8">
                <di:waypoint x="-788" y="-55" />
                <di:waypoint x="-663" y="-55" />
              </bpmndi:BPMNEdge>
              <bpmndi:BPMNShape id="Task_1wba5if_di" bpmnElement="Task_1wba5if">
                <dc:Bounds x="-583" y="47" width="100" height="80" />
              </bpmndi:BPMNShape>
              <bpmndi:BPMNEdge id="SequenceFlow_13bmeft_di" bpmnElement="SequenceFlow_13bmeft">
                <di:waypoint x="-483" y="87" />
                <di:waypoint x="-418" y="87" />
              </bpmndi:BPMNEdge>
              <bpmndi:BPMNEdge id="SequenceFlow_0xz3tyu_di" bpmnElement="SequenceFlow_0xz3tyu">
                <di:waypoint x="-638" y="-30" />
                <di:waypoint x="-638" y="87" />
                <di:waypoint x="-583" y="87" />
              </bpmndi:BPMNEdge>
            </bpmndi:BPMNPlane>
          </bpmndi:BPMNDiagram>
        </bpmn:definitions>`,
      };

      const requestHeaders: IRequestHeaders = this._getRequestHeaders();

      await this._http.post(requestDestination, requestPayload, requestHeaders);

      await browser.sleep(this._processEngineActionTimeout);
    }

    public async deleteDiagram(): Promise<void> {
      const requestDestination: string = `/api/management/v1/process_models/${this.name}/delete`;
      const requestHeaders: IRequestHeaders = this._getRequestHeaders();

      await this._http.get(requestDestination, requestHeaders);
    }

    public async startProcess(): Promise<void> {
      const requestDestination: string =
        `/api/management/v1/process_models/${this.name}/start?start_callback_type=1&start_event_id=StartEvent_1mox3jl`;

      const requestPayload: IRequestPayload = {};
      const requestHeaders: IRequestHeaders = this._getRequestHeaders();

      await this._http.post(requestDestination, requestPayload, requestHeaders).jsonBody.then((jsonBody: JSON) => {
        this.correlationId = jsonBody['correlationId'];
        this.processInstanceId = jsonBody['processInstanceId'];
      });

      this.userTaskDynamicUiUrl = this._applicationUrl +
                                  '/correlation/' + this.correlationId +
                                  '/diagram/' + this.name +
                                  '/instance/' + this.processInstanceId +
                                  '/task/' + this.userTaskId;

      await browser.sleep(this._processEngineActionTimeout);
    }

    private _getRequestHeaders(): IRequestHeaders {
      const requestHeaders: IRequestHeaders = {
        authorization: 'Bearer ZHVtbXlfdG9rZW4=',
      };

      return requestHeaders;
    }
}
