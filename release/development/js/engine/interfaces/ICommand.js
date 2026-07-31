/**
 * ICommand — the undo/redo unit used by HistoryManager (Command pattern).
 * Extend this and implement execute()/undo(). `label` is for UI (e.g. "Paint").
 * The engine ships NO concrete commands.
 */
export default class ICommand {
  constructor(label = '') {
    this.label = label;
  }

  /** Apply the change. */
  execute() {}

  /** Revert the change applied by execute(). */
  undo() {}
}
