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
                    height: auto;
                    min-height: 180px;
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
                    padding: 24px;
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
                    z-index: 20;
                }

                .dialogue-main-container {
                    display: flex;
                    flex-direction: row;
                    width: 100%;
                    height: 100%;
                    gap: 16px;
                    overflow: hidden;
                }

                .dialogue-text-side {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                }

                .dialogue-portrait {
                    width: 140px;
                    height: 160px;
                    flex-shrink: 0;
                    display: flex;
                    align-items: flex-end;
                    justify-content: center;
                    filter: drop-shadow(4px 4px 0 rgba(0,0,0,0.3));
                    align-self: flex-end;
                    margin-bottom: -10px;
                }

                .dialogue-portrait img {
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                    image-rendering: pixelated;
                }

                .dialogue-content {
                    font-size: 16px;
                    line-height: 1.6;
                    color: #1a1a2e;
                    overflow: hidden;
                    margin-bottom: 10px;
                }

                .dialogue-choices {
                    margin-top: 10px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
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
                    right: 20px;
                    bottom: 20px;
                    width: 0;
                    height: 0;
                    border-left: 10px solid transparent;
                    border-right: 10px solid transparent;
                    border-top: 15px solid #1a1a2e;
                    display: none;
                    animation: bounce 0.6s infinite alternate;
                    z-index: 25;
                }

                @keyframes bounce {
                    from { transform: translateY(0); }
                    to { transform: translateY(5px); }
                }

                @media (max-width: 768px) {
                    #dialogue-ui-root {
                        height: auto;
                        min-height: 110px;
                        bottom: 15px;
                    }
                    .dialogue-box {
                        padding: 15px;
                        border-width: 4px;
                    }
                    .dialogue-main-container {
                        gap: 10px;
                    }
                    .dialogue-name-tag {
                        font-size: 10px;
                        top: -18px;
                        padding: 6px 12px;
                    }
                    .dialogue-content {
                        font-size: 9px;
                        line-height: 1.3;
                    }
                    .dialogue-portrait {
                        width: 80px;
                        height: 90px;
                        margin-bottom: -5px;
                    }
                    .dialogue-choice-btn {
                        font-size: 8px;
                        padding: 6px;
                    }
                    .dialogue-arrow {
                        right: 10px;
                        bottom: 10px;
                        border-left-width: 6px;
                        border-right-width: 6px;
                        border-top-width: 10px;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        this._root = document.createElement('div');
        this._root.id = 'dialogue-ui-root';
        this._root.innerHTML = `
            <div class="dialogue-box">
                <div class="dialogue-name-tag"></div>
                <div class="dialogue-main-container">
                    <div class="dialogue-text-side">
                        <div class="dialogue-content"></div>
                        <div class="dialogue-choices"></div>
                    </div>
                    <div class="dialogue-portrait"></div>
                </div>
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
        
        // Handle touch to prevent movement under UI
        this._root.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
        this._root.addEventListener('touchend', (e) => e.stopPropagation(), { passive: true });

        // Handle clicking to skip/next
        this._root.addEventListener('click', (e) => {
            e.stopPropagation();
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
        this._onComplete = config.onComplete;
        this._updateFontSize(config.text || '', !!config.choices);
        this._isTyping = true;
        this._typeText(config.text || '');
    }

    _updateFontSize(text, hasChoices) {
        const len = text.length;
        let size = 14; // Default starting a bit smaller to be safe
        
        if (len > 250) size = 9;
        else if (len > 180) size = 10;
        else if (len > 120) size = 12;
        else size = 14;

        // Even smaller if we have choices taking up space
        if (hasChoices) {
            if (len > 150) size -= 1;
            if (len > 100) size -= 1;
        }

        // Apply to element
        this._textEl.style.fontSize = `${size}px`;
        this._textEl.style.lineHeight = '1.4';
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
