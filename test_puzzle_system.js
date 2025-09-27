// Simple test to validate puzzle system implementation
import { DualSwitchPuzzle, HoldMechanismPuzzle, PuzzleManager } from './client/js/engine/PuzzleSystem.js';

// Mock player objects for testing
const mockPlayers = [
    { id: 'player1', x: 150, y: 300, width: 32, height: 32, isAlive: true },
    { id: 'player2', x: 650, y: 300, width: 32, height: 32, isAlive: true }
];

// Mock game engine
const mockGameEngine = {
    canvas: { width: 800, height: 600 }
};

// Test DualSwitchPuzzle
console.log('Testing DualSwitchPuzzle...');

const dualSwitchConfig = {
    requiredPlayers: 2,
    requiredHoldTime: 3.0,
    elements: [
        {
            id: 'switch_1',
            type: 'switch',
            x: 150,
            y: 300,
            width: 50,
            height: 50,
            requiresContinuousInteraction: true
        },
        {
            id: 'switch_2',
            type: 'switch',
            x: 650,
            y: 300,
            width: 50,
            height: 50,
            requiresContinuousInteraction: true
        }
    ]
};

const dualSwitchPuzzle = new DualSwitchPuzzle(dualSwitchConfig);
dualSwitchPuzzle.activate();

console.log('DualSwitchPuzzle created and activated');
console.log('Elements:', dualSwitchPuzzle.elements.length);
console.log('Required players:', dualSwitchPuzzle.requiredPlayers);

// Test HoldMechanismPuzzle
console.log('\nTesting HoldMechanismPuzzle...');

const holdMechanismConfig = {
    requiredPlayers: 2,
    sacrificeDelay: 5.0,
    mechanismX: 150,
    mechanismY: 300,
    doorX: 650,
    doorY: 250
};

const holdMechanismPuzzle = new HoldMechanismPuzzle(holdMechanismConfig);
holdMechanismPuzzle.activate();

console.log('HoldMechanismPuzzle created and activated');
console.log('Mechanism position:', holdMechanismPuzzle.mechanism.x, holdMechanismPuzzle.mechanism.y);
console.log('Exit door position:', holdMechanismPuzzle.exitDoor.x, holdMechanismPuzzle.exitDoor.y);

// Test PuzzleManager
console.log('\nTesting PuzzleManager...');

const puzzleManager = new PuzzleManager(mockGameEngine);
puzzleManager.addPuzzle('dual_switch', dualSwitchPuzzle);
puzzleManager.addPuzzle('hold_mechanism', holdMechanismPuzzle);

console.log('PuzzleManager created with 2 puzzles');
console.log('Puzzles:', Array.from(puzzleManager.puzzles.keys()));

// Test puzzle activation
puzzleManager.activatePuzzle('dual_switch');
console.log('Activated dual_switch puzzle');
console.log('Active puzzle:', puzzleManager.getActivePuzzle()?.type);

console.log('\nAll puzzle system tests completed successfully!');