import * as THREE from 'three';
import { GameScene } from 'zortengine';
import { UIManager } from 'zortengine/browser';
import { RoomSessionClient } from '../runtime/RoomSessionClient.js';

export class MainMenuScene extends GameScene {
    constructor(options = {}) {
        super({
            name: 'main-menu',
            background: new THREE.Color(0x050816)
        });
        this.options = options;
        this.selectedRoomId = options.initialRoomId || '';
    }

    setup() {
        const viewport = this.engine.platform.getViewportSize();
        const camera = new THREE.PerspectiveCamera(50, viewport.width / viewport.height, 0.1, 100);
        camera.position.set(0, 0, 8);
        this.setCamera(camera);

        this.ui = this.registerSystem('ui', new UIManager({
            platform: this.engine.platform,
            parent: this.engine.container
        }), { priority: 200 });

        this.roomClient = new RoomSessionClient({
            url: this.options.networkUrl,
            playerId: this.options.playerId,
            playerName: this.options.playerName
        });

        this._buildUi();
        this._wireEvents();
        this._setStatus('Baglaniyor...');
    }

    onEnter() {
        if (this.ui?.container) {
            this.ui.container.style.display = 'block';
        }
        this.roomClient?.connect();
        this.roomClient?.listRooms();
    }

    onExit() {
        if (this.ui?.container) {
            this.ui.container.style.display = 'none';
        }
        this.roomClient?.disconnect();
    }

    onResize(width, height, aspect) {
        super.onResize(width, height, aspect);
        if (this.camera?.isPerspectiveCamera) {
            this.camera.aspect = aspect;
            this.camera.updateProjectionMatrix();
        }
    }

    _buildUi() {
        if (!this.ui?.document) return;

        const doc = this.ui.document;
        this.ui.container.style.background = [
            'radial-gradient(circle at 12% 16%, rgba(39,174,96,0.22), transparent 24%)',
            'radial-gradient(circle at 85% 18%, rgba(52,152,219,0.18), transparent 22%)',
            'radial-gradient(circle at 64% 80%, rgba(34,211,238,0.10), transparent 18%)',
            'linear-gradient(180deg, rgba(4,8,18,0.96) 0%, rgba(6,10,20,1) 52%, rgba(10,16,28,1) 100%)'
        ].join(', ');
        this.ui.container.style.fontFamily = 'Inter, system-ui, sans-serif';
        this.ui.container.style.overflow = 'hidden';

        const shell = this.ui.addPanel('menu-shell', '4%', '5%', '92%', {
            display: 'block',
            background: 'transparent',
            border: 'none',
            padding: '0',
            radius: '0',
            pointerEvents: 'none',
            boxShadow: 'none'
        });
        shell.style.height = '90%';
        shell.style.display = 'grid';
        shell.style.gridTemplateRows = 'auto minmax(0, 1fr)';
        shell.style.gap = '16px';
        shell.style.overflow = 'hidden';
        this.shell = shell;

        const hero = doc.createElement('div');
        hero.style.display = 'grid';
        hero.style.gridTemplateColumns = 'minmax(0, 1.15fr) minmax(280px, 0.85fr)';
        hero.style.gap = '18px';
        hero.style.alignItems = 'end';
        hero.style.pointerEvents = 'none';
        shell.appendChild(hero);

        const heroCopy = doc.createElement('div');
        hero.appendChild(heroCopy);

        const eyebrow = doc.createElement('div');
        eyebrow.innerText = 'OPERATION READY';
        eyebrow.style.display = 'inline-block';
        eyebrow.style.padding = '7px 11px';
        eyebrow.style.borderRadius = '999px';
        eyebrow.style.letterSpacing = '0.18em';
        eyebrow.style.fontSize = '11px';
        eyebrow.style.fontWeight = '700';
        eyebrow.style.color = '#86efac';
        eyebrow.style.background = 'rgba(39, 174, 96, 0.12)';
        eyebrow.style.border = '1px solid rgba(39, 174, 96, 0.24)';
        heroCopy.appendChild(eyebrow);

        const title = doc.createElement('h1');
        title.innerHTML = 'Operation<br>Extraction';
        title.style.margin = '14px 0 10px';
        title.style.fontSize = 'clamp(42px, 5vw, 72px)';
        title.style.lineHeight = '0.92';
        title.style.letterSpacing = '-0.04em';
        title.style.color = '#f8fafc';
        title.style.textShadow = '0 12px 42px rgba(0,0,0,0.42)';
        heroCopy.appendChild(title);

        const subtitle = doc.createElement('p');
        subtitle.innerText = 'Landing Bay operasyonuna tek basina gir, ayni cihazda coop ac veya bir oda kurup takimi toplu sekilde savaşa sok.';
        subtitle.style.maxWidth = '620px';
        subtitle.style.margin = '0';
        subtitle.style.fontSize = '16px';
        subtitle.style.lineHeight = '1.55';
        subtitle.style.color = '#cbd5e1';
        heroCopy.appendChild(subtitle);

        const chipRow = doc.createElement('div');
        chipRow.style.display = 'flex';
        chipRow.style.flexWrap = 'wrap';
        chipRow.style.gap = '8px';
        chipRow.style.marginTop = '14px';
        chipRow.style.pointerEvents = 'none';
        heroCopy.appendChild(chipRow);
        [
            'Tek ekran ana menu',
            'Oda tabanli multiplayer',
            'Local duo'
        ].forEach(label => chipRow.appendChild(this._createInfoChip(label)));

        const heroStatus = doc.createElement('div');
        heroStatus.style.padding = '18px';
        heroStatus.style.borderRadius = '22px';
        heroStatus.style.background = 'linear-gradient(180deg, rgba(15,23,42,0.72), rgba(6,12,22,0.92))';
        heroStatus.style.border = '1px solid rgba(52,152,219,0.18)';
        heroStatus.style.boxShadow = '0 16px 36px rgba(0,0,0,0.28)';
        hero.appendChild(heroStatus);

        heroStatus.innerHTML = `
            <div style="font-size:12px;letter-spacing:0.16em;color:#22d3ee;font-weight:700;margin-bottom:10px;">MISSION PROFILE</div>
            <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;">
                <div style="padding:12px;border-radius:14px;background:rgba(39,174,96,0.10);border:1px solid rgba(39,174,96,0.18);">
                    <div style="font-size:11px;color:#86efac;letter-spacing:0.12em;text-transform:uppercase;">Arazi</div>
                    <div style="margin-top:6px;font-size:18px;font-weight:800;color:#f8fafc;">Ground / Green</div>
                </div>
                <div style="padding:12px;border-radius:14px;background:rgba(230,126,34,0.10);border:1px solid rgba(230,126,34,0.18);">
                    <div style="font-size:11px;color:#fdba74;letter-spacing:0.12em;text-transform:uppercase;">Rampa</div>
                    <div style="margin-top:6px;font-size:18px;font-weight:800;color:#f8fafc;">Forge / Orange</div>
                </div>
                <div style="padding:12px;border-radius:14px;background:rgba(52,152,219,0.10);border:1px solid rgba(52,152,219,0.18);">
                    <div style="font-size:11px;color:#7dd3fc;letter-spacing:0.12em;text-transform:uppercase;">Prop</div>
                    <div style="margin-top:6px;font-size:18px;font-weight:800;color:#f8fafc;">Crate / Blue</div>
                </div>
                <div style="padding:12px;border-radius:14px;background:rgba(34,211,238,0.10);border:1px solid rgba(34,211,238,0.18);">
                    <div style="font-size:11px;color:#67e8f9;letter-spacing:0.12em;text-transform:uppercase;">Tehlike</div>
                    <div style="margin-top:6px;font-size:18px;font-weight:800;color:#f8fafc;">Pool / Cyan</div>
                </div>
            </div>
        `;

        const contentGrid = doc.createElement('div');
        contentGrid.style.display = 'grid';
        contentGrid.style.gridTemplateColumns = 'minmax(420px, 1.15fr) minmax(340px, 0.85fr)';
        contentGrid.style.gap = '18px';
        contentGrid.style.alignItems = 'stretch';
        contentGrid.style.minHeight = '0';
        contentGrid.style.height = '100%';
        shell.appendChild(contentGrid);

        const playPanel = this.ui.addPanel('play-panel', '0', '0', '100%', {
            display: 'block',
            background: 'linear-gradient(180deg, rgba(8, 15, 30, 0.82), rgba(10, 18, 34, 0.94))',
            border: '1px solid rgba(39,174,96,0.12)',
            padding: '20px',
            radius: '22px'
        });
        playPanel.style.position = 'relative';
        playPanel.style.left = '0';
        playPanel.style.top = '0';
        playPanel.style.width = 'auto';
        playPanel.style.height = '100%';
        playPanel.style.pointerEvents = 'auto';
        playPanel.style.overflow = 'hidden';
        contentGrid.appendChild(playPanel);

        const roomPanel = this.ui.addPanel('room-list', '0', '0', '100%', {
            display: 'block',
            background: 'linear-gradient(180deg, rgba(8, 15, 30, 0.82), rgba(10, 18, 34, 0.94))',
            border: '1px solid rgba(52,152,219,0.14)',
            padding: '20px',
            radius: '22px'
        });
        roomPanel.style.position = 'relative';
        roomPanel.style.left = '0';
        roomPanel.style.top = '0';
        roomPanel.style.width = 'auto';
        roomPanel.style.pointerEvents = 'auto';
        roomPanel.style.height = '100%';
        roomPanel.style.overflow = 'hidden';
        contentGrid.appendChild(roomPanel);

        const lobbyPanel = this.ui.addPanel('lobby-panel', '4%', '74%', '92%', {
            display: 'none',
            background: 'linear-gradient(180deg, rgba(6,14,24,0.98), rgba(6,10,20,0.98))',
            border: '1px solid rgba(34,211,238,0.18)',
            padding: '22px',
            radius: '22px'
        });
        lobbyPanel.style.position = 'absolute';
        lobbyPanel.style.left = '50%';
        lobbyPanel.style.top = '54%';
        lobbyPanel.style.width = 'min(860px, 78vw)';
        lobbyPanel.style.transform = 'translate(-50%, -50%)';
        lobbyPanel.style.minHeight = '150px';
        lobbyPanel.style.maxHeight = '68vh';
        lobbyPanel.style.zIndex = '5';
        lobbyPanel.style.boxShadow = '0 24px 70px rgba(0,0,0,0.45)';
        this.lobbyPanel = lobbyPanel;

        const playHeading = doc.createElement('div');
        playHeading.innerHTML = `
            <div style="font-size:12px;letter-spacing:0.16em;color:#86efac;font-weight:700;margin-bottom:8px;">DEPLOY</div>
            <div style="font-size:28px;font-weight:800;color:#f8fafc;margin-bottom:6px;">Run sec ve hazirlan</div>
            <div style="font-size:14px;line-height:1.55;color:#94a3b8;">Offline veya online modu sec, oyuncu adini belirle ve direkt operasyona gir.</div>
        `;
        playPanel.appendChild(playHeading);

        const fieldGrid = doc.createElement('div');
        fieldGrid.style.display = 'grid';
        fieldGrid.style.gridTemplateColumns = '1fr 1fr';
        fieldGrid.style.gap = '12px';
        fieldGrid.style.marginTop = '16px';
        playPanel.appendChild(fieldGrid);

        const playerField = this._createFieldBlock('Oyuncu adi', 'Lobide gorunen isim');
        const roomField = this._createFieldBlock('Oda kodu', 'Katilmak veya kurmak icin');
        fieldGrid.appendChild(playerField.wrapper);
        fieldGrid.appendChild(roomField.wrapper);

        this.playerNameInput = playerField.input;
        this.playerNameInput.value = this.options.playerName || 'Oyuncu';
        this.playerNameInput.placeholder = 'Oyuncu adini gir';

        this.roomNameInput = roomField.input;
        this.roomNameInput.value = this.options.initialRoomId || '';
        this.roomNameInput.placeholder = 'ornek: alpha-room';

        const modeGrid = doc.createElement('div');
        modeGrid.style.display = 'grid';
        modeGrid.style.gridTemplateColumns = '1fr 1fr';
        modeGrid.style.gap = '12px';
        modeGrid.style.marginTop = '14px';
        playPanel.appendChild(modeGrid);

        const singleCard = this._createModeCard(
            'Solo Run',
            'Tek kisilik roguelite akisini hemen baslat.',
            'Hizli oyun, gunluk seed, tek oyuncu'
        );
        const coopCard = this._createModeCard(
            'Local Duo',
            'Ayni cihazda iki oyunculu test akisini ac.',
            'Duo loadout, local coop kontrolleri'
        );
        modeGrid.appendChild(singleCard);
        modeGrid.appendChild(coopCard);

        singleCard.appendChild(this._createActionButton('Singleplayer Baslat', {
            variant: 'primary',
            onClick: () => this._startOfflineRun()
        }));
        coopCard.appendChild(this._createActionButton('Local Coop Baslat', {
            onClick: () => this._startOfflineRun({ loadoutId: 'duo-protocol' })
        }));

        const networkHeading = doc.createElement('div');
        networkHeading.innerHTML = `
            <div style="font-size:12px;letter-spacing:0.16em;color:#22d3ee;font-weight:700;margin:18px 0 8px;">NETWORK</div>
            <div style="font-size:20px;font-weight:800;color:#f8fafc;margin-bottom:4px;">Online lobby</div>
            <div style="font-size:13px;line-height:1.55;color:#94a3b8;">Kendi odani kur, aktif odalardan birine katil veya listeyi yenile.</div>
        `;
        playPanel.appendChild(networkHeading);

        const actionRow = doc.createElement('div');
        actionRow.style.display = 'flex';
        actionRow.style.flexWrap = 'wrap';
        actionRow.style.gap = '10px';
        actionRow.style.marginTop = '12px';
        playPanel.appendChild(actionRow);

        actionRow.appendChild(this._createActionButton('Oda Kur', {
            variant: 'primary',
            onClick: () => this._createRoom()
        }));
        actionRow.appendChild(this._createActionButton('Odaya Katil', {
            onClick: () => this._joinSelectedRoom()
        }));
        actionRow.appendChild(this._createActionButton('Odaları Yenile', {
            variant: 'ghost',
            onClick: () => this.roomClient?.listRooms()
        }));

        const roomHeading = doc.createElement('div');
        roomHeading.innerHTML = `
            <div style="font-size:12px;letter-spacing:0.16em;color:#3498db;font-weight:700;margin-bottom:8px;">ACTIVE ROOMS</div>
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-end;">
                <div>
                    <div style="font-size:26px;font-weight:800;color:#f8fafc;margin-bottom:6px;">Aktif odalar</div>
                    <div style="font-size:13px;line-height:1.55;color:#94a3b8;">Sunucudaki lobbyleri sec, kodu doldur ve dogrudan katil.</div>
                </div>
            </div>
        `;
        roomPanel.appendChild(roomHeading);

        this.roomMeta = doc.createElement('div');
        this.roomMeta.style.marginTop = '16px';
        this.roomMeta.style.display = 'flex';
        this.roomMeta.style.gap = '10px';
        this.roomMeta.style.flexWrap = 'wrap';
        roomPanel.appendChild(this.roomMeta);

        this.roomMeta.appendChild(this._createInfoChip('Canli liste'));
        this.roomMeta.appendChild(this._createInfoChip('Host kontrollu baslatma'));

        this.roomListContent = doc.createElement('div');
        this.roomListContent.style.display = 'grid';
        this.roomListContent.style.gap = '10px';
        this.roomListContent.style.marginTop = '16px';
        roomPanel.appendChild(this.roomListContent);

        const lobbyTop = doc.createElement('div');
        lobbyTop.style.display = 'flex';
        lobbyTop.style.justifyContent = 'space-between';
        lobbyTop.style.alignItems = 'center';
        lobbyTop.style.gap = '14px';
        lobbyTop.style.marginBottom = '18px';
        lobbyPanel.appendChild(lobbyTop);

        const lobbyTitle = doc.createElement('div');
        lobbyTitle.innerHTML = `
            <div style="font-size:12px;letter-spacing:0.16em;color:#22d3ee;font-weight:700;margin-bottom:8px;">LOBBY</div>
            <div style="font-size:26px;font-weight:800;color:#f8fafc;">Takim hazirlaniyor</div>
        `;
        lobbyTop.appendChild(lobbyTitle);

        this.lobbyBadge = this._createInfoChip('Bagli degil');
        lobbyTop.appendChild(this.lobbyBadge);

        this.lobbyContent = doc.createElement('div');
        this.lobbyContent.style.display = 'grid';
        this.lobbyContent.style.gridTemplateColumns = '1.35fr 0.9fr';
        this.lobbyContent.style.gap = '16px';
        lobbyPanel.appendChild(this.lobbyContent);

        this.lobbyInfo = doc.createElement('div');
        this.lobbyInfo.style.padding = '18px';
        this.lobbyInfo.style.borderRadius = '18px';
        this.lobbyInfo.style.background = 'rgba(15,23,42,0.56)';
        this.lobbyInfo.style.border = '1px solid rgba(148,163,184,0.12)';
        this.lobbyContent.appendChild(this.lobbyInfo);

        const lobbyActions = doc.createElement('div');
        lobbyActions.style.display = 'grid';
        lobbyActions.style.gap = '12px';
        this.lobbyContent.appendChild(lobbyActions);

        this.startRoomButton = this._createActionButton('Odayi Baslat', {
            variant: 'primary',
            onClick: () => this.roomClient?.startRoom()
        });
        lobbyActions.appendChild(this.startRoomButton);

        this.leaveRoomButton = this._createActionButton('Odadan Ayril', {
            variant: 'danger',
            onClick: () => this.roomClient?.leaveRoom()
        });
        lobbyActions.appendChild(this.leaveRoomButton);

        this.statusBar = doc.createElement('div');
        this.statusBar.style.display = 'inline-flex';
        this.statusBar.style.alignItems = 'center';
        this.statusBar.style.gap = '10px';
        this.statusBar.style.padding = '12px 14px';
        this.statusBar.style.borderRadius = '18px';
        this.statusBar.style.background = 'rgba(10,18,32,0.84)';
        this.statusBar.style.border = '1px solid rgba(34,211,238,0.14)';
        this.statusBar.style.color = '#cbd5e1';
        this.statusBar.style.pointerEvents = 'none';
        this.statusBar.style.boxShadow = '0 12px 26px rgba(0,0,0,0.28)';
        heroStatus.appendChild(this.statusBar);

        const statusDot = doc.createElement('span');
        statusDot.style.width = '10px';
        statusDot.style.height = '10px';
        statusDot.style.borderRadius = '50%';
        statusDot.style.background = '#22d3ee';
        statusDot.style.boxShadow = '0 0 16px rgba(34,211,238,0.75)';
        this.statusBar.appendChild(statusDot);

        this.statusText = doc.createElement('span');
        this.statusText.style.fontSize = '14px';
        this.statusText.style.fontWeight = '600';
        this.statusBar.appendChild(this.statusText);
    }

    _wireEvents() {
        if (!this.roomClient) return;

        this.roomClient.on('connected', () => {
            this._setStatus('Sunucuya baglandi. Oda listesi guncelleniyor...');
            this.roomClient.listRooms();
        });

        this.roomClient.on('room_list', rooms => {
            this._renderRoomList(rooms);
            this._setStatus(`${rooms.length} oda bulundu.`);
        });

        this.roomClient.on('room_joined', room => {
            this.selectedRoomId = room.id;
            if (this.roomNameInput) {
                this.roomNameInput.value = room.id;
            }
            this.ui.show('lobby-panel');
            this._renderLobby(room);
            this._setStatus(`Odaya girildi: ${room.name}`);
        });

        this.roomClient.on('room_updated', room => {
            this._renderLobby(room);
            this._renderRoomList(this.roomClient.rooms);
        });

        this.roomClient.on('room_left', () => {
            this.ui.hide('lobby-panel');
            this._setStatus('Lobbyden ayrildin.');
            this.roomClient.listRooms();
        });

        this.roomClient.on('room_started', room => {
            this._setStatus(`Oda basladi: ${room.name}`);
            this.emit('requestStartRun', {
                network: {
                    enabled: true,
                    url: this.options.networkUrl,
                    roomId: room.id,
                    playerId: this.roomClient.playerId
                }
            });
        });

        this.roomClient.on('error', payload => {
            this._setStatus(payload?.message || 'Sunucu hatasi olustu.');
        });
    }

    _createRoom() {
        this._syncPlayerIdentity();
        const roomName = this.roomNameInput?.value?.trim() || `room-${Date.now().toString(36)}`;
        this.roomClient?.createRoom(roomName);
        this._setStatus(`Oda kuruluyor: ${roomName}`);
    }

    _joinSelectedRoom() {
        this._syncPlayerIdentity();
        const roomId = this.roomNameInput?.value?.trim() || this.selectedRoomId;
        if (!roomId) {
            this._setStatus('Once bir oda sec veya oda kodu gir.');
            return;
        }
        this.roomClient?.joinRoom(roomId);
        this._setStatus(`Odaya katiliniyor: ${roomId}`);
    }

    _syncPlayerIdentity() {
        const playerName = this.playerNameInput?.value?.trim() || 'Oyuncu';
        this.roomClient?.setPlayerName(playerName);
    }

    _startOfflineRun(overrides = {}) {
        this._syncPlayerIdentity();
        this.emit('requestStartRun', overrides);
    }

    _renderRoomList(rooms = []) {
        if (!this.roomListContent) return;
        this.roomListContent.innerHTML = '';
        if (this.roomMeta) {
            this.roomMeta.innerHTML = '';
            this.roomMeta.appendChild(this._createInfoChip(`${rooms.length} aktif oda`));
            this.roomMeta.appendChild(this._createInfoChip(this.selectedRoomId ? `Secili: ${this.selectedRoomId}` : 'Bir oda sec'));
        }

        const visibleRooms = rooms.slice(0, 4);

        if (rooms.length === 0) {
            const empty = this.ui.document.createElement('div');
            empty.style.padding = '16px';
            empty.style.borderRadius = '18px';
            empty.style.background = 'rgba(15,23,42,0.56)';
            empty.style.border = '1px dashed rgba(52,152,219,0.18)';
            empty.style.color = '#94a3b8';
            empty.style.lineHeight = '1.6';
            empty.innerHTML = '<strong style="display:block;color:#e2e8f0;margin-bottom:6px;">Henuz aktif oda yok</strong>Ilk lobbyyi sen kurup arkadaslarini davet edebilirsin.';
            this.roomListContent.appendChild(empty);
            return;
        }

        for (const room of visibleRooms) {
            const card = this.ui.document.createElement('button');
            card.style.pointerEvents = 'auto';
            card.style.textAlign = 'left';
            card.style.padding = '14px';
            card.style.borderRadius = '18px';
            card.style.border = room.id === this.selectedRoomId
                ? '1px solid rgba(52,152,219,0.95)'
                : '1px solid rgba(255,255,255,0.08)';
            card.style.background = room.id === this.selectedRoomId
                ? 'linear-gradient(180deg, rgba(52,152,219,0.22), rgba(15,23,42,0.92))'
                : 'rgba(15,23,42,0.62)';
            card.style.color = '#fff';
            card.style.cursor = 'pointer';
            card.style.boxShadow = room.id === this.selectedRoomId
                ? '0 18px 40px rgba(52,152,219,0.18)'
                : 'none';
            card.innerHTML = `
                <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
                    <div>
                        <div style="font-size:16px;font-weight:800;color:#f8fafc;margin-bottom:4px;">${room.name}</div>
                        <div style="color:#94a3b8;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">Kod ${room.id}</div>
                    </div>
                    <div style="padding:6px 10px;border-radius:999px;background:rgba(255,255,255,0.06);font-size:11px;color:#cbd5e1;">
                        ${this._formatRoomStatus(room.status)}
                    </div>
                </div>
                <div style="margin-top:10px;color:#cbd5e1;font-size:13px;">
                    ${room.playerCount} oyuncu bagli
                </div>
            `;
            card.addEventListener('click', () => {
                this.selectedRoomId = room.id;
                if (this.roomNameInput) {
                    this.roomNameInput.value = room.id;
                }
                this._renderRoomList(rooms);
            });
            this.roomListContent.appendChild(card);
        }

        if (rooms.length > visibleRooms.length) {
            const more = this.ui.document.createElement('div');
            more.style.color = '#64748b';
            more.style.fontSize = '12px';
            more.style.padding = '2px 4px';
            more.innerText = `Ve ${rooms.length - visibleRooms.length} oda daha...`;
            this.roomListContent.appendChild(more);
        }
    }

    _renderLobby(room) {
        if (!this.lobbyInfo) return;
        const players = room.players || [];
        const playerLines = players
            .map(player => `
                <div style="display:flex;justify-content:space-between;gap:10px;padding:11px 13px;border-radius:14px;background:rgba(255,255,255,0.04);border:1px solid rgba(148,163,184,0.08);">
                    <div>
                        <div style="font-weight:700;color:#f8fafc;">${player.playerName}</div>
                        <div style="font-size:12px;color:#94a3b8;">${player.playerId}</div>
                    </div>
                    <div style="font-size:12px;color:${player.connected ? '#86efac' : '#fbbf24'};text-align:right;">
                        ${player.playerId === room.hostId ? 'HOST<br>' : ''}
                        ${player.connected ? 'bagli' : 'yeniden baglaniyor'}
                    </div>
                </div>
            `)
            .join('');

        this.lobbyInfo.innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:14px;">
                <div style="padding:11px 13px;border-radius:14px;background:rgba(255,255,255,0.04);">
                    <div style="font-size:12px;letter-spacing:0.1em;color:#94a3b8;text-transform:uppercase;">Oda</div>
                    <div style="margin-top:6px;font-size:16px;font-weight:800;color:#f8fafc;">${room.name}</div>
                </div>
                <div style="padding:11px 13px;border-radius:14px;background:rgba(255,255,255,0.04);">
                    <div style="font-size:12px;letter-spacing:0.1em;color:#94a3b8;text-transform:uppercase;">Kod</div>
                    <div style="margin-top:6px;font-size:16px;font-weight:800;color:#f8fafc;">${room.id}</div>
                </div>
                <div style="padding:11px 13px;border-radius:14px;background:rgba(255,255,255,0.04);">
                    <div style="font-size:12px;letter-spacing:0.1em;color:#94a3b8;text-transform:uppercase;">Durum</div>
                    <div style="margin-top:6px;font-size:16px;font-weight:800;color:#f8fafc;">${this._formatRoomStatus(room.status)}</div>
                </div>
            </div>
            <div style="font-size:12px;letter-spacing:0.14em;color:#22d3ee;text-transform:uppercase;margin-bottom:10px;">Oyuncular</div>
            <div style="display:grid;gap:10px;">${playerLines || '<div style="color:#94a3b8;">Bekleniyor...</div>'}</div>
        `;

        const isHost = room.hostId === this.roomClient?.playerId;
        this.startRoomButton.disabled = !isHost;
        this.startRoomButton.style.opacity = isHost ? '1' : '0.5';
        this.startRoomButton.innerText = isHost ? 'Odayi Baslat' : 'Sadece host baslatabilir';
        if (this.lobbyBadge) {
            this.lobbyBadge.innerText = `${this._formatRoomStatus(room.status)} • ${players.length} oyuncu`;
        }
    }

    _setStatus(text) {
        if (this.statusText) {
            this.statusText.innerText = text;
        }
    }

    _createInfoChip(label) {
        const chip = this.ui.document.createElement('div');
        chip.innerText = label;
        chip.style.display = 'inline-flex';
        chip.style.alignItems = 'center';
        chip.style.padding = '7px 11px';
        chip.style.borderRadius = '999px';
        chip.style.background = 'rgba(15,23,42,0.52)';
        chip.style.border = '1px solid rgba(52,152,219,0.14)';
        chip.style.color = '#cbd5e1';
        chip.style.fontSize = '11px';
        chip.style.fontWeight = '700';
        return chip;
    }

    _createFieldBlock(label, hint) {
        const wrapper = this.ui.document.createElement('label');
        wrapper.style.display = 'grid';
        wrapper.style.gap = '6px';

        const title = this.ui.document.createElement('div');
        title.innerHTML = `<span style="font-size:12px;font-weight:700;color:#e2e8f0;">${label}</span><br><span style="font-size:11px;color:#64748b;">${hint}</span>`;
        wrapper.appendChild(title);

        const input = this.ui.document.createElement('input');
        input.type = 'text';
        input.style.width = '100%';
        input.style.boxSizing = 'border-box';
        input.style.padding = '12px 14px';
        input.style.borderRadius = '12px';
        input.style.border = '1px solid rgba(52,152,219,0.16)';
        input.style.background = 'rgba(11,18,32,0.96)';
        input.style.color = '#f8fafc';
        input.style.outline = 'none';
        input.style.pointerEvents = 'auto';
        wrapper.appendChild(input);

        return { wrapper, input };
    }

    _createModeCard(title, description, footnote) {
        const card = this.ui.document.createElement('div');
        card.style.padding = '16px';
        card.style.borderRadius = '18px';
        card.style.background = 'rgba(255,255,255,0.035)';
        card.style.border = '1px solid rgba(255,255,255,0.08)';
        card.innerHTML = `
            <div style="font-size:18px;font-weight:800;color:#f8fafc;margin-bottom:6px;">${title}</div>
            <div style="font-size:13px;line-height:1.55;color:#cbd5e1;">${description}</div>
            <div style="font-size:11px;color:#64748b;margin:10px 0 14px;">${footnote}</div>
        `;
        return card;
    }

    _createActionButton(label, options = {}) {
        const button = this.ui.document.createElement('button');
        button.innerText = label;
        button.style.pointerEvents = 'auto';
        button.style.padding = '11px 15px';
        button.style.borderRadius = '12px';
        button.style.border = '1px solid rgba(148,163,184,0.12)';
        button.style.cursor = 'pointer';
        button.style.fontWeight = '700';
        button.style.fontSize = '13px';
        button.style.transition = 'transform 120ms ease, opacity 120ms ease';

        if (options.variant === 'primary') {
            button.style.background = 'linear-gradient(135deg, rgba(39,174,96,0.96), rgba(52,152,219,0.92))';
            button.style.color = '#eff6ff';
            button.style.boxShadow = '0 12px 28px rgba(39,174,96,0.22)';
        } else if (options.variant === 'danger') {
            button.style.background = 'rgba(231,76,60,0.18)';
            button.style.color = '#fecaca';
        } else if (options.variant === 'ghost') {
            button.style.background = 'rgba(52,152,219,0.10)';
            button.style.color = '#dbeafe';
        } else {
            button.style.background = 'rgba(255,255,255,0.06)';
            button.style.color = '#e2e8f0';
        }

        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-1px)';
        });
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
        });
        if (typeof options.onClick === 'function') {
            button.addEventListener('click', options.onClick);
        }
        return button;
    }

    _formatRoomStatus(status) {
        if (status === 'running') return 'Oyunda';
        if (status === 'lobby') return 'Lobby';
        return status || 'Bilinmiyor';
    }
}
