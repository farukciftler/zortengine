/**
 * DialogueSystem — State machine for handling branching conversations independently of the UI.
 */
export class DialogueSystem {
    constructor() {
        this.context = null;
        this.currentDialogue = null;
        this.currentNode = null;
        this.onNodeChanged = null; // Callback for UI updates
        this.onComplete = null;
    }

    onAttach(context) {
        this.context = context;
    }

    /**
     * Start a specific dialogue tree.
     */
    startDialogue(dialogueData, callbacks = {}) {
        this.currentDialogue = dialogueData;
        this.onNodeChanged = callbacks.onNodeChanged;
        this.onComplete = callbacks.onComplete;
        
        // Find the start node (first one if not specified)
        this.currentNode = dialogueData.nodes?.[0] || null;
        this._notifyNodeUpdate();
    }

    /**
     * Select a choice from the current node.
     */
    selectChoice(choiceIndex) {
        if (!this.currentNode || !this.currentNode.choices) return;
        
        const choice = this.currentNode.choices[choiceIndex];
        if (!choice) return;

        if (choice.nextNodeId) {
            this.goToNode(choice.nextNodeId);
        } else {
            this.endDialogue();
        }
    }

    /**
     * Jump to a specific node by ID.
     */
    goToNode(nodeId) {
        const nextNode = this.currentDialogue.nodes.find(n => n.id === nodeId);
        if (nextNode) {
            this.currentNode = nextNode;
            this._notifyNodeUpdate();
        } else {
            this.endDialogue();
        }
    }

    endDialogue() {
        const prevDialogue = this.currentDialogue;
        this.currentDialogue = null;
        this.currentNode = null;
        if (this.onComplete) {
            this.onComplete(prevDialogue);
        }
    }

    _notifyNodeUpdate() {
        if (this.onNodeChanged && this.currentNode) {
            this.onNodeChanged(this.currentNode);
        }
    }
}
