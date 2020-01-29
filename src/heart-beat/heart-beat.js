import { setAsyncInterval, clearAsyncInterval } from "src/helpers/async-interval"
import Exception from "src/helpers/exception";

/**
 * To avoid linear growth with the number of data, the heart beat was introduced.
 */

export default class HeartBeat {

    constructor(scope){

        this._scope = scope;

        this._processes = {};

        this._startedStatus = false;
    }

    start(){

        if (this._startedStatus) return;

        this._started();

        this._startedStatus = true;
    }

    _started(){
        if (!this._intervalProcesses)
            this._intervalProcesses = setAsyncInterval( this._executeProcesses.bind(this), 200 );
    }

    async close(){

        if (!this._startedStatus) return;

        await this._closed();

        this._startedStatus = false;

    }

    async _closed(){
        await clearAsyncInterval(this._intervalProcesses);
    }

    existsProcess(processName){
        return this._processes[processName];
    }

    /**
     * Add a new Process
     * @param processName
     * @param handle
     * @param priority
     * @param tasks
     */
    addProcess( processName, handle,  priority = 1, ){

        if (this._processes[processName])
            throw new Exception(this, "process already exists", {processName: processName});

        return this._processes[processName] = {

            handle: handle,

            tasks: {},
            tasksArray: [],

            priority: priority,

            taskIndex: 0,

            promise: undefined,

        }

    }

    addProcessAndTask( processName, handleTask,  priority, taskId, removedTaskAfterCompletion = false ){

        if (!this._processes[processName])
            this.addProcess(processName, undefined, priority);

        return this.addTaskForProcess( processName, taskId, handleTask, removedTaskAfterCompletion, undefined );

    }

    stopProcess( processName ){

        if (this._processes[processName]) {
            delete this._processes[processName];
            return true;
        }

    }


    addTaskForProcess( processName, taskId, handleTask, removedTaskAfterCompletion = true,  handleExists ){

        const process = this._processes[processName];

        if (!process)
            throw new Exception(this, "process was not found", {processName: processName});

        if ( process.tasks[taskId])
            if (handleExists)
                return handleExists ( process.tasks[taskId], process );

        const task = process.tasks[taskId] = {
            removedTaskAfterCompletion: removedTaskAfterCompletion,
            handleTask: handleTask,
        };

        process.tasksArray.push(taskId);

        return task;

    }

    async removeTaskFromProcess( processName, taskId){

        const process =  this._processes[processName];

        if (!process) return;

        if (process.tasks[taskId]){

            if (process.tasks[taskId].promise)
                await process.tasks[taskId].promise;

            delete process.tasks[taskId];

            for (let i=0; i < process.tasksArray.length; i++)
                if ( process.tasksArray[i] === taskId ) {
                    process.tasksArray.splice(i, 1);
                    break;
                }

            if (process.tasksArray.length === 0)
                delete this._processes[processName];

            return true;

        }

    }

    async removeProcess( processName ){

        if (this._processes[processName]){

            const process =  this._processes[processName];
            const promises = [];

            for (const taskId in  process.tasks)
                promises.push( this.removeTaskFromProcess(processName, taskId ) );

            return Promise.all( promises );

        }

    }

    async _executeProcesses(){

        for (const processName in this._processes){

            const process =  this._processes[processName];
            if (process.tasksArray.length === 0) continue;

            for (let i=0; i < process.priority; i++){

                if (process.tasksArray.length === 0) break;

                if ( process.taskIndex >= process.tasksArray.length )
                    process.taskIndex = 0;

                const taskName = process.tasksArray[process.taskIndex];
                const task = process.tasks[taskName];

                const handle = task.handleTask || process.handle;

                task.promise = new Promise( (resolve) => resolve( handle ( taskName, processName ) ) );

                await task.promise;

                if (task.removedTaskAfterCompletion){
                    delete process.tasks[taskName];
                    process.tasksArray.splice( process.taskIndex, 1);
                    process.taskIndex--;
                }

                process.taskIndex++;

            }

        }

    }

}