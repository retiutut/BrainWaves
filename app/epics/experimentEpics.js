import { combineEpics } from "redux-observable";
import { map, mapTo, pluck, filter, takeUntil, tap } from "rxjs/operators";
import {
  LOAD_DEFAULT_TIMELINE,
  START,
  STOP
} from "../actions/experimentActions";
import {
  DEVICES,
  MUSE_CHANNELS,
  EMOTIV_CHANNELS
} from "../constants/constants";
import { loadTimeline } from "../utils/jspsych/functions";
import {
  createEEGWriteStream,
  writeHeader,
  writeEEGData
} from "../utils/filesystem/write";

export const SET_TIMELINE = "LOAD_TIMELINE";
export const SET_IS_RUNNING = "SET_IS_RUNNING";
export const SET_SESSION = "SET_SESSION";
export const EXPERIMENT_CLEANUP = "EXPERIMENT_CLEANUP";

// -------------------------------------------------------------------------
// Action Creators

const setTimeline = payload => ({
  payload,
  type: SET_TIMELINE
});

const setIsRunning = payload => ({
  payload,
  type: SET_IS_RUNNING
});

const setSession = payload => ({
  payload,
  type: SET_SESSION
});

const cleanup = () => ({
  type: EXPERIMENT_CLEANUP
});

// -------------------------------------------------------------------------
// Epics

const loadDefaultTimelineEpic = (action$, state$) =>
  action$.ofType(LOAD_DEFAULT_TIMELINE).pipe(
    map(() => state$.value.experiment.type),
    map(loadTimeline),
    map(setTimeline)
  );

const startEpic = (action$, state$) =>
  action$.ofType(START).pipe(
    filter(
      () =>
        !state$.value.experiment.isRunning &&
        state$.value.device.rawObservable &&
        state$.value.experiment.subject !== ""
    ),
    map(() => {
      const writeStream = createEEGWriteStream(
        state$.value.experiment.type,
        state$.value.experiment.subject,
        state$.value.experiment.session
      );

      writeHeader(
        writeStream,
        state$.value.device.deviceType === DEVICES.EMOTIV
          ? EMOTIV_CHANNELS
          : MUSE_CHANNELS
      );
      state$.value.device.rawObservable
        .pipe(takeUntil(action$.ofType(STOP, EXPERIMENT_CLEANUP)))
        .subscribe(eegData => writeEEGData(writeStream, eegData));
    }),
    mapTo(true),
    map(setIsRunning)
  );

const experimentStopEpic = action$ =>
  action$.ofType(STOP).pipe(map(() => setIsRunning(false)));

const sessionCountEpic = (action$, state$) =>
  action$.ofType(STOP).pipe(
    filter(() => state$.value.experiment.isRunning),
    map(() => setSession(state$.value.experiment.session + 1))
  );

const navigationCleanupEpic = action$ =>
  action$.ofType("@@router/LOCATION_CHANGE").pipe(
    pluck("payload", "pathname"),
    filter(pathname => pathname === "/"),
    map(cleanup)
  );

export default combineEpics(
  loadDefaultTimelineEpic,
  startEpic,
  experimentStopEpic,
  sessionCountEpic,
  navigationCleanupEpic
);
