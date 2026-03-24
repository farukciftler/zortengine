/**
 * DialogueUI.js
 * A modular, high-quality pixel-art dialogue system for NPCs and interactions.
 */
export class DialogueUI {
    constructor(scene) {
        this.scene = scene;
        this._root = null;
        this._textEl = null;
        this._nameEl = null;
        this._portraitEl = null;
        this._choiceContainer = null;
        this._arrowEl = null;
        
        this._activeConfig = null;
        this._isVisible = false;
        this._isTyping = false;
        this._typeTimeout = null;
        this._onComplete = null;
        this._onChoice = null;
        
        this._ensureDom();
    }

    _ensureDom() {
        if (typeof document === 'undefined') return;
        
        const id = 'dialogue-ui-styles';
        if (!document.getElementById(id)) {
            const style = document.createElement('style');
            style.id = id;
            style.textContent = `
                #dialogue-ui-root {
                    position: fixed;
                    bottom: 24px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: min(800px, 92vw);
                    height: 180px;
                    z-index: 9500;
                    display: none;
                    font-family: 'Press Start 2P', cursive;
                    image-rendering: pixelated;
                    pointer-events: auto;
                }

                .dialogue-box {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    background: #fff8dc;
                    border: 6px solid #1a1a2e;
                    box-shadow: 
                        0 8px 0 rgba(0,0,0,0.3),
                        inset -8px -8px 0 #c9b87a;
                    padding: 32px;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                }

                .dialogue-name-tag {
                    position: absolute;
                    top: -24px;
                    left: 20px;
                    background: #d35400;
                    color: white;
                    padding: 8px 16px;
                    border: 4px solid #1a1a2e;
                    font-size: 14px;
                    box-shadow: 4px 4px 0 rgba(0,0,0,0.2);
                    text-transform: uppercase;
                }

                .dialogue-portrait {
                    position: absolute;
                    right: -20px;
                    bottom: 0px;
                    width: 180px;
                    height: 220px;
                    background: none;
                    z-index: 10;
                    display: flex;
                    align-items: flex-end;
                    justify-content: center;
                    filter: drop-shadow(4px 4px 0 rgba(0,0,0,0.3));
                }

                .dialogue-portrait img {
                    max-width: 100%;
                    max-height: 100%;
                    image-rendering: pixelated;
                }

                .dialogue-content {
                    flex: 1;
                    font-size: 16px;
                    line-height: 1.6;
                    color: #1a1a2e;
                    overflow: hidden;
                    margin-right: 140px; /* Space for portrait */
                }

                .dialogue-choices {
                    margin-top: 10px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin-right: 140px;
                }

                .dialogue-choice-btn {
                    background: #1a1a2e;
                    color: white;
                    border: none;
                    padding: 10px;
                    font-family: inherit;
                    font-size: 10px;
                    text-align: left;
                    cursor: pointer;
                    transition: transform 0.1s;
                }

                .dialogue-choice-btn:hover {
                    background: #d35400;
                    transform: scale(1.02);
                }

                .dialogue-arrow {
                    position: absolute;
                    right: 160px;
                    bottom: 20px;
                    width: 0;
                    height: 0;
                    border-left: 10px solid transparent;
                    border-right: 10px solid transparent;
                    border-top: 15px solid #1a1a2e;
                    display: none;
                    animation: bounce 0.6s infinite alternate;
                }

                @keyframes bounce {
                    from { transform: translateY(0); }
                    to { transform: translateY(5px); }
                }
            `;
            document.head.appendChild(style);
        }

        this._root = document.createElement('div');
        this._root.id = 'dialogue-ui-root';
        this._root.innerHTML = `
            <div class="dialogue-box">
                <div class="dialogue-name-tag"></div>
                <div class="dialogue-portrait"></div>
                <div class="dialogue-content"></div>
                <div class="dialogue-choices"></div>
                <div class="dialogue-arrow"></div>
            </div>
        `;

        const parent = this.scene.engine?.container || document.body;
        parent.appendChild(this._root);

        this._nameEl = this._root.querySelector('.dialogue-name-tag');
        this._portraitEl = this._root.querySelector('.dialogue-portrait');
        this._textEl = this._root.querySelector('.dialogue-content');
        this._choiceContainer = this._root.querySelector('.dialogue-choices');
        this._arrowEl = this._root.querySelector('.dialogue-arrow');
        
        // Handle clicking to skip/next
        this._root.addEventListener('click', () => {
            if (this._isTyping) {
                this._skipTyping();
            } else if (this._activeConfig && !this._activeConfig.choices) {
                this._finishDialogue();
            }
        });
    }

    /**
     * Shows a dialogue.
     * @param {object} config { name, text, portraitUrl, choices, onComplete, onChoice }
     */
    show(config) {
        this._activeConfig = config;
        this._isVisible = true;
        this._root.style.display = 'block';
        
        this._nameEl.textContent = config.name || '???';
        this._nameEl.style.display = config.name ? 'block' : 'none';
        
        if (config.portraitUrl) {
            this._portraitEl.innerHTML = `<img src="${config.portraitUrl}" alt="Portrait" />`;
            this._portraitEl.style.display = 'flex';
        } else {
            this._portraitEl.style.display = 'none';
        }

        this._choiceContainer.innerHTML = '';
        this._arrowEl.style.display = 'none';
        this._isTyping = true;
        this._typeText(config.text || '');
        this._onComplete = config.onComplete;
    }

    hide() {
        this._isVisible = false;
        this._root.style.display = 'none';
        this._isTyping = false;
        if (this._typeTimeout) clearTimeout(this._typeTimeout);
    }

    _typeText(text) {
        let index = 0;
        this._textEl.textContent = '';
        
        const nextChar = () => {
            if (index < text.length) {
                this._textEl.textContent += text[index];
                index++;
                this._typeTimeout = setTimeout(nextChar, 40);
            } else {
                this._onTypingFinished();
            }
        };
        
        nextChar();
    }

    _skipTyping() {
        if (this._typeTimeout) clearTimeout(this._typeTimeout);
        this._textEl.textContent = this._activeConfig.text;
        this._onTypingFinished();
    }

    _onTypingFinished() {
        this._isTyping = false;
        if (this._activeConfig.choices) {
            this._showChoices(this._activeConfig.choices);
        } else {
            this._arrowEl.style.display = 'block';
        }
    }

    _showChoices(choices) {
        choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'dialogue-choice-btn';
            btn.textContent = `${choice.text}`;
            btn.onclick = (e) => {
                e.stopPropagation();
                if (choice.onSelect) choice.onSelect();
                if (this._activeConfig.onChoice) this._activeConfig.onChoice(choice);
                if (choice.nextText) {
                    this.show({
                        ...this._activeConfig,
                        text: choice.nextText,
                        choices: choice.nextChoices
                    });
                } else {
                    this._finishDialogue();
                }
            };
            this._choiceContainer.appendChild(btn);
        });
    }

    _finishDialogue() {
        if (this._onComplete) this._onComplete();
        this.hide();
    }
}
