/**
 * AudioManager - Comprehensive audio system for the game
 * Handles background music, sound effects, volume controls, and audio loading
 */
export class AudioManager {
    constructor() {
        // Audio context for advanced audio features
        this.audioContext = null;
        this.masterGainNode = null;
        this.musicGainNode = null;
        this.sfxGainNode = null;

        // Audio storage
        this.audioBuffers = new Map(); // For Web Audio API
        this.htmlAudioElements = new Map(); // For HTML5 Audio (fallback)

        // Volume settings (0.0 to 1.0)
        this.masterVolume = 0.7;
        this.musicVolume = 0.5;
        this.sfxVolume = 0.8;
        this.isMuted = false;

        // Current music state
        this.currentMusic = null;
        this.musicFadeInterval = null;

        // Audio loading state
        this.isLoading = false;
        this.loadedCount = 0;
        this.totalCount = 0;

        // Initialize audio system
        this.initializeAudioContext();
        this.setupAudioNodes();
    }

    /**
     * Initialize Web Audio API context
     */
    initializeAudioContext() {
        try {
            // Create audio context
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();

            // Handle browser autoplay policy
            if (this.audioContext.state === 'suspended') {
                // Audio context is suspended, will need user interaction to resume
                this.setupAutoplayHandler();
            }

            console.log('AudioManager: Web Audio API initialized');
        } catch (error) {
            console.warn('AudioManager: Web Audio API not supported, falling back to HTML5 Audio', error);
            this.audioContext = null;
        }
    }

    /**
     * Setup audio nodes for volume control
     */
    setupAudioNodes() {
        if (!this.audioContext) return;

        try {
            // Create master gain node
            this.masterGainNode = this.audioContext.createGain();
            this.masterGainNode.connect(this.audioContext.destination);
            this.masterGainNode.gain.value = this.masterVolume;

            // Create music gain node
            this.musicGainNode = this.audioContext.createGain();
            this.musicGainNode.connect(this.masterGainNode);
            this.musicGainNode.gain.value = this.musicVolume;

            // Create SFX gain node
            this.sfxGainNode = this.audioContext.createGain();
            this.sfxGainNode.connect(this.masterGainNode);
            this.sfxGainNode.gain.value = this.sfxVolume;

            console.log('AudioManager: Audio nodes setup complete');
        } catch (error) {
            console.error('AudioManager: Failed to setup audio nodes', error);
        }
    }

    /**
     * Setup handler for browser autoplay policy
     */
    setupAutoplayHandler() {
        const resumeAudio = () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(() => {
                    console.log('AudioManager: Audio context resumed');
                });
            }
        };

        // Resume on any user interaction
        document.addEventListener('click', resumeAudio, { once: true });
        document.addEventListener('keydown', resumeAudio, { once: true });
        document.addEventListener('touchstart', resumeAudio, { once: true });
    }

    /**
     * Load audio assets
     */
    async loadAudioAssets() {
        // Skip audio loading in development if assets don't exist
        const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isDevelopment) {
            console.log('AudioManager: Skipping audio loading in development mode');
            this.isLoading = false;
            return;
        }

        console.log('AudioManager: Loading audio assets...');
        this.isLoading = true;
        this.loadedCount = 0;

        // Define audio assets to load
        const audioAssets = {
            // Background music for different levels
            music: {
                'menu': 'assets/audio/music/menu.ogg',
                'level0': 'assets/audio/music/tutorial.ogg',
                'level1': 'assets/audio/music/facility.ogg',
                'level2': 'assets/audio/music/boss_fight.ogg',
                'level3': 'assets/audio/music/puzzle.ogg',
                'level4': 'assets/audio/music/sacrifice.ogg',
                'level5': 'assets/audio/music/final_challenge.ogg',
                'ending': 'assets/audio/music/ending.ogg'
            },
            // Sound effects
            sfx: {
                // Player actions
                'player_move': 'assets/audio/sfx/footstep.ogg',
                'player_attack': 'assets/audio/sfx/swing.ogg',
                'player_dash': 'assets/audio/sfx/dash.ogg',
                'player_hurt': 'assets/audio/sfx/player_hurt.ogg',
                'player_death': 'assets/audio/sfx/player_death.ogg',

                // Combat
                'enemy_hurt': 'assets/audio/sfx/enemy_hurt.ogg',
                'enemy_death': 'assets/audio/sfx/enemy_death.ogg',
                'boss_roar': 'assets/audio/sfx/boss_roar.ogg',
                'hit_impact': 'assets/audio/sfx/hit.ogg',

                // Interactions
                'button_press': 'assets/audio/sfx/button.ogg',
                'door_open': 'assets/audio/sfx/door.ogg',
                'elevator_move': 'assets/audio/sfx/elevator.ogg',
                'puzzle_solve': 'assets/audio/sfx/puzzle_complete.ogg',
                'mechanism_activate': 'assets/audio/sfx/mechanism.ogg',

                // Environmental
                'falling_rock': 'assets/audio/sfx/rock_fall.ogg',
                'radiation_ambient': 'assets/audio/sfx/radiation.ogg',
                'blizzard_wind': 'assets/audio/sfx/wind.ogg',
                'reactor_shutdown': 'assets/audio/sfx/reactor_shutdown.ogg',

                // UI
                'dialogue_type': 'assets/audio/sfx/text_type.ogg',
                'level_complete': 'assets/audio/sfx/level_complete.ogg',
                'sacrifice_moment': 'assets/audio/sfx/sacrifice.ogg'
            }
        };

        // Count total assets
        this.totalCount = Object.keys(audioAssets.music).length + Object.keys(audioAssets.sfx).length;

        // Load music
        for (const [name, url] of Object.entries(audioAssets.music)) {
            await this.loadAudioFile(`music_${name}`, url, true);
        }

        // Load sound effects
        for (const [name, url] of Object.entries(audioAssets.sfx)) {
            await this.loadAudioFile(`sfx_${name}`, url, false);
        }

        this.isLoading = false;
        console.log(`AudioManager: Loaded ${this.loadedCount}/${this.totalCount} audio assets`);
    }

    /**
     * Load individual audio file
     */
    async loadAudioFile(name, url, isMusic = false) {
        try {
            if (this.audioContext) {
                // Use Web Audio API for better performance
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Failed to fetch ${url}: ${response.status}`);
                }

                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                
                this.audioBuffers.set(name, {
                    buffer: audioBuffer,
                    isMusic: isMusic,
                    url: url
                });
            } else {
                // Fallback to HTML5 Audio
                const audio = new Audio(url);
                audio.preload = 'auto';
                
                await new Promise((resolve, reject) => {
                    audio.addEventListener('canplaythrough', resolve, { once: true });
                    audio.addEventListener('error', reject, { once: true });
                    audio.load();
                });

                this.htmlAudioElements.set(name, {
                    element: audio,
                    isMusic: isMusic,
                    url: url
                });
            }

            this.loadedCount++;
            console.log(`AudioManager: Loaded ${name} (${this.loadedCount}/${this.totalCount})`);
        } catch (error) {
            // Only log the first few missing files to avoid spam
            if (this.loadedCount < 3) {
                console.warn(`AudioManager: Failed to load ${name} from ${url} (${error.message})`);
                if (this.loadedCount === 2) {
                    console.warn('AudioManager: Suppressing further audio loading warnings...');
                }
            }
            // Continue loading other assets even if one fails
        }
    }

    /**
     * Play background music for a specific level
     */
    playLevelMusic(levelNumber) {
        const musicMap = {
            0: 'music_level0',
            1: 'music_level1',
            2: 'music_level2',
            3: 'music_level3',
            4: 'music_level4',
            5: 'music_level5'
        };

        const musicName = musicMap[levelNumber];
        if (musicName) {
            this.playMusic(musicName, true); // Loop level music
        }
    }

    /**
     * Play music with optional looping and fade in
     */
    playMusic(name, loop = true, fadeInDuration = 1.0) {
        if (this.isMuted) return;

        // Stop current music first
        this.stopMusic();

        try {
            if (this.audioContext && this.audioBuffers.has(name)) {
                // Use Web Audio API
                const audioData = this.audioBuffers.get(name);
                const source = this.audioContext.createBufferSource();
                source.buffer = audioData.buffer;
                source.loop = loop;
                source.connect(this.musicGainNode);

                // Fade in effect
                if (fadeInDuration > 0) {
                    this.musicGainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                    this.musicGainNode.gain.linearRampToValueAtTime(
                        this.musicVolume, 
                        this.audioContext.currentTime + fadeInDuration
                    );
                }

                source.start();
                this.currentMusic = { source, name, type: 'webaudio' };

            } else if (this.htmlAudioElements.has(name)) {
                // Use HTML5 Audio
                const audioData = this.htmlAudioElements.get(name);
                const audio = audioData.element;
                
                audio.loop = loop;
                audio.volume = this.musicVolume * this.masterVolume;
                audio.currentTime = 0;
                
                const playPromise = audio.play();
                if (playPromise) {
                    playPromise.catch(error => {
                        console.warn('AudioManager: Failed to play music:', error);
                    });
                }

                this.currentMusic = { element: audio, name, type: 'html5' };

                // Fade in effect for HTML5 audio
                if (fadeInDuration > 0) {
                    audio.volume = 0;
                    this.fadeInHTML5Audio(audio, this.musicVolume * this.masterVolume, fadeInDuration);
                }
            }

            console.log(`AudioManager: Playing music: ${name}`);
        } catch (error) {
            console.error('AudioManager: Failed to play music:', error);
        }
    }

    /**
     * Stop current music with optional fade out
     */
    stopMusic(fadeOutDuration = 0.5) {
        if (!this.currentMusic) return;

        try {
            if (this.currentMusic.type === 'webaudio') {
                if (fadeOutDuration > 0) {
                    this.musicGainNode.gain.linearRampToValueAtTime(
                        0, 
                        this.audioContext.currentTime + fadeOutDuration
                    );
                    setTimeout(() => {
                        if (this.currentMusic && this.currentMusic.source) {
                            this.currentMusic.source.stop();
                        }
                    }, fadeOutDuration * 1000);
                } else {
                    this.currentMusic.source.stop();
                }
            } else if (this.currentMusic.type === 'html5') {
                if (fadeOutDuration > 0) {
                    this.fadeOutHTML5Audio(this.currentMusic.element, fadeOutDuration);
                } else {
                    this.currentMusic.element.pause();
                }
            }

            console.log(`AudioManager: Stopped music: ${this.currentMusic.name}`);
            this.currentMusic = null;
        } catch (error) {
            console.error('AudioManager: Failed to stop music:', error);
        }
    }

    /**
     * Play sound effect
     */
    playSFX(name, volume = 1.0, pitch = 1.0) {
        if (this.isMuted) return;

        const sfxName = name.startsWith('sfx_') ? name : `sfx_${name}`;

        try {
            if (this.audioContext && this.audioBuffers.has(sfxName)) {
                // Use Web Audio API for better control
                const audioData = this.audioBuffers.get(sfxName);
                const source = this.audioContext.createBufferSource();
                const gainNode = this.audioContext.createGain();

                source.buffer = audioData.buffer;
                source.playbackRate.value = pitch; // Pitch control
                
                gainNode.gain.value = volume;
                source.connect(gainNode);
                gainNode.connect(this.sfxGainNode);

                source.start();

                // Clean up after sound finishes
                source.onended = () => {
                    gainNode.disconnect();
                };

            } else if (this.htmlAudioElements.has(sfxName)) {
                // Use HTML5 Audio (clone for multiple simultaneous plays)
                const audioData = this.htmlAudioElements.get(sfxName);
                const audio = audioData.element.cloneNode();
                
                audio.volume = volume * this.sfxVolume * this.masterVolume;
                audio.playbackRate = pitch;
                
                const playPromise = audio.play();
                if (playPromise) {
                    playPromise.catch(error => {
                        console.warn('AudioManager: Failed to play SFX:', error);
                    });
                }
            }
        } catch (error) {
            console.error(`AudioManager: Failed to play SFX ${sfxName}:`, error);
        }
    }

    /**
     * Set master volume (0.0 to 1.0)
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        
        if (this.masterGainNode) {
            this.masterGainNode.gain.value = this.masterVolume;
        }

        // Update HTML5 audio elements
        for (const audioData of this.htmlAudioElements.values()) {
            if (audioData.isMusic && this.currentMusic && this.currentMusic.element === audioData.element) {
                audioData.element.volume = this.musicVolume * this.masterVolume;
            }
        }

        console.log(`AudioManager: Master volume set to ${this.masterVolume}`);
    }

    /**
     * Set music volume (0.0 to 1.0)
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        
        if (this.musicGainNode) {
            this.musicGainNode.gain.value = this.musicVolume;
        }

        // Update current HTML5 music
        if (this.currentMusic && this.currentMusic.type === 'html5') {
            this.currentMusic.element.volume = this.musicVolume * this.masterVolume;
        }

        console.log(`AudioManager: Music volume set to ${this.musicVolume}`);
    }

    /**
     * Set SFX volume (0.0 to 1.0)
     */
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        
        if (this.sfxGainNode) {
            this.sfxGainNode.gain.value = this.sfxVolume;
        }

        console.log(`AudioManager: SFX volume set to ${this.sfxVolume}`);
    }

    /**
     * Toggle mute state
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (this.isMuted) {
            if (this.masterGainNode) {
                this.masterGainNode.gain.value = 0;
            }
            if (this.currentMusic && this.currentMusic.type === 'html5') {
                this.currentMusic.element.volume = 0;
            }
        } else {
            if (this.masterGainNode) {
                this.masterGainNode.gain.value = this.masterVolume;
            }
            if (this.currentMusic && this.currentMusic.type === 'html5') {
                this.currentMusic.element.volume = this.musicVolume * this.masterVolume;
            }
        }

        console.log(`AudioManager: Audio ${this.isMuted ? 'muted' : 'unmuted'}`);
        return this.isMuted;
    }

    /**
     * Fade in HTML5 audio element
     */
    fadeInHTML5Audio(audio, targetVolume, duration) {
        const steps = 20;
        const stepDuration = duration / steps;
        const volumeStep = targetVolume / steps;
        let currentStep = 0;

        const fadeInterval = setInterval(() => {
            currentStep++;
            audio.volume = volumeStep * currentStep;
            
            if (currentStep >= steps) {
                clearInterval(fadeInterval);
                audio.volume = targetVolume;
            }
        }, stepDuration * 1000);
    }

    /**
     * Fade out HTML5 audio element
     */
    fadeOutHTML5Audio(audio, duration) {
        const steps = 20;
        const stepDuration = duration / steps;
        const initialVolume = audio.volume;
        const volumeStep = initialVolume / steps;
        let currentStep = 0;

        const fadeInterval = setInterval(() => {
            currentStep++;
            audio.volume = initialVolume - (volumeStep * currentStep);
            
            if (currentStep >= steps) {
                clearInterval(fadeInterval);
                audio.pause();
                audio.volume = initialVolume; // Reset for next use
            }
        }, stepDuration * 1000);
    }

    /**
     * Get current volume settings
     */
    getVolumeSettings() {
        return {
            master: this.masterVolume,
            music: this.musicVolume,
            sfx: this.sfxVolume,
            isMuted: this.isMuted
        };
    }

    /**
     * Get loading progress
     */
    getLoadingProgress() {
        return {
            isLoading: this.isLoading,
            loaded: this.loadedCount,
            total: this.totalCount,
            progress: this.totalCount > 0 ? this.loadedCount / this.totalCount : 0
        };
    }

    /**
     * Check if audio system is ready
     */
    isReady() {
        return !this.isLoading && this.loadedCount > 0;
    }

    /**
     * Cleanup audio resources
     */
    destroy() {
        // Stop current music
        this.stopMusic(0);

        // Clear fade intervals
        if (this.musicFadeInterval) {
            clearInterval(this.musicFadeInterval);
        }

        // Disconnect audio nodes
        if (this.masterGainNode) {
            this.masterGainNode.disconnect();
        }
        if (this.musicGainNode) {
            this.musicGainNode.disconnect();
        }
        if (this.sfxGainNode) {
            this.sfxGainNode.disconnect();
        }

        // Close audio context
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }

        // Clear audio storage
        this.audioBuffers.clear();
        this.htmlAudioElements.clear();

        console.log('AudioManager: Destroyed');
    }
}