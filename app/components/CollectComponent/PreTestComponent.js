import React, { Component } from "react";
import { isNil } from "lodash";
import { Grid, Segment, Button, List } from "semantic-ui-react";
import ViewerComponent from "../ViewerComponent";
import SignalQualityIndicatorComponent from "../SignalQualityIndicatorComponent";
import PreviewExperimentComponent from "../PreviewExperimentComponent";
import styles from "../styles/collect.css";
import {
  PLOTTING_INTERVAL,
  CONNECTION_STATUS,
} from "../../constants/constants";

interface Props {
  experimentActions: Object;
  connectedDevice: Object;
  signalQualityObservable: ?any;
  deviceType: DEVICES;
  deviceAvailability: DEVICE_AVAILABILITY;
  connectionStatus: CONNECTION_STATUS;
  deviceActions: Object;
  experimentActions: Object;
  availableDevices: Array<any>;
  type: ?EXPERIMENTS;
  isRunning: boolean;
  mainTimeline: MainTimeline;
  trials: { [string]: Trial };
  timelines: { [string]: Timeline };
  // dir: ?string,
  subject: string;
  session: number;
  openRunComponent: () => void;
}

interface State {
  isPreviewing: boolean;
}

export default class PreTestComponent extends Component<Props, State> {
  props: Props;
  state: State;
  handlePreview: () => void;

  constructor(props: Props) {
    super(props);
    this.state = {
      isPreviewing: false
    };
    this.handlePreview = this.handlePreview.bind(this);
  }

  handlePreview() {
    if (isNil(this.props.mainTimeline)) {
      this.props.experimentActions.loadDefaultTimeline();
    }
    this.setState({ isPreviewing: !this.state.isPreviewing });
  }

  renderSignalQualityOrPreview() {
    if (this.state.isPreviewing) {
      return (
        <PreviewExperimentComponent
          isPreviewing={this.state.isPreviewing}
          mainTimeline={this.props.mainTimeline}
          trials={this.props.trials}
          timelines={this.props.timelines}
        />
      );
    }
    return (
      <Segment basic>
        <SignalQualityIndicatorComponent
          signalQualityObservable={this.props.signalQualityObservable}
          plottingInterval={PLOTTING_INTERVAL}
        />
        <Segment basic>
          <List>
            <List.Item>
              <List.Icon name="circle" className={styles.greatSignal} />
              <List.Content>Strong Signal</List.Content>
            </List.Item>
            <List.Item>
              <List.Icon name="circle" className={styles.okSignal} />
              <List.Content>Mediocre signal</List.Content>
            </List.Item>
            <List.Item>
              <List.Icon name="circle" className={styles.badSignal} />
              <List.Content>Weak Signal</List.Content>
            </List.Item>
          </List>
        </Segment>
      </Segment>
    );
  }

  renderPreviewButton() {
    if (!this.state.isPreviewing) {
      return (
        <Button secondary onClick={this.handlePreview}>
          Preview Experiment
        </Button>
      );
    }
    return (
      <Button negative onClick={this.handlePreview}>
        Stop Preview
      </Button>
    );
  }

  render() {
    return (
      <Grid columns="equal" textAlign="center" verticalAlign="middle">
        <Grid.Column width={6}>
          {this.renderSignalQualityOrPreview()}
        </Grid.Column>
        <Grid.Column width={8}>
          {this.renderPreviewButton()}
          <Button
            primary
            disabled={
              this.props.connectionStatus !== CONNECTION_STATUS.CONNECTED
            }
            onClick={this.props.openRunComponent}
          >
            Run & Record Experiment
          </Button>
          <ViewerComponent
            signalQualityObservable={this.props.signalQualityObservable}
            deviceType={this.props.deviceType}
            samplingRate={this.props.connectedDevice["samplingRate"]}
            plottingInterval={PLOTTING_INTERVAL}
          />
        </Grid.Column>
      </Grid>
    );
  }
}
