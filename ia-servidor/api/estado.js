// GET / : service status, without secrets.
import {createStatusHandler} from '../lib/handlers.js';

export default createStatusHandler();
