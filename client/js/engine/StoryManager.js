/**
 * StoryManager - Handles rich storytelling, dialogue, and narrative elements
 */
export class StoryManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.currentStorySegment = null;
        this.storyQueue = [];
        this.isPlayingStory = false;
        this.storyTimer = 0;
        
        // Story database
        this.stories = this.initializeStories();
    }

    initializeStories() {
        return {
            level0: {
                intro: {
                    speaker: "Dr. Petrov",
                    text: "Thank God... you made it. I don't have much time left...",
                    duration: 4.0,
                    emotion: "desperate"
                },
                disaster: {
                    speaker: "Dr. Petrov", 
                    text: "The reactor... it's going critical. The explosion will kill millions...",
                    duration: 4.5,
                    emotion: "urgent"
                },
                mission: {
                    speaker: "Dr. Petrov",
                    text: "You three are our only hope. But the path ahead... it will demand everything.",
                    duration: 5.0,
                    emotion: "solemn"
                },
                warning: {
                    speaker: "Dr. Petrov",
                    text: "Not all of you will make it to the end. Sacrifices must be made...",
                    duration: 4.5,
                    emotion: "tragic"
                }
            },
            level1: {
                entrance: {
                    speaker: "System",
                    text: "FACILITY BREACH DETECTED. CONTAMINATED ENTITIES APPROACHING.",
                    duration: 3.5,
                    emotion: "warning"
                },
                combat_start: {
                    speaker: "Radio Static",
                    text: "The radiation... it's changed them. Stay together. Watch each other's backs.",
                    duration: 4.0,
                    emotion: "tense"
                }
            }
        };
    }

    playStory(levelNumber, segment) {
        const story = this.stories[`level${levelNumber}`]?.[segment];
        if (!story) return false;

        this.currentStorySegment = story;
        this.isPlayingStory = true;
        this.storyTimer = 0;
        
        // Trigger dialogue system
        if (this.gameEngine.dialogueSystem) {
            this.gameEngine.dialogueSystem.showDialogue(story.speaker, story.text, story.duration);
        }
        
        return true;
    }

    update(deltaTime) {
        if (!this.isPlayingStory) return;
        
        this.storyTimer += deltaTime;
        
        if (this.currentStorySegment && this.storyTimer >= this.currentStorySegment.duration) {
            this.isPlayingStory = false;
            this.currentStorySegment = null;
            this.storyTimer = 0;
        }
    }

    isStoryActive() {
        return this.isPlayingStory;
    }
}