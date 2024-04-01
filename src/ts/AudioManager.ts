import * as THREE from 'three'

const listener = new THREE.AudioListener();

const pistol_shoot_sound = new THREE.Audio(listener);
const pistol_reload_sound = new THREE.Audio(listener);
const bullet_impact_sound = new THREE.Audio(listener);
const ambience_sound = new THREE.Audio(listener);
const grass_step_sound = new THREE.Audio(listener);
const tree_fall_sound = new THREE.Audio(listener);

// Axe - Hatchet
const axe_hit_1_sound = new THREE.Audio(listener);
const axe_hit_2_sound = new THREE.Audio(listener);
const axe_hit_3_sound = new THREE.Audio(listener);

// Wood - Step Sounds

const wood_step_1_sound = new THREE.Audio(listener);
const wood_step_2_sound = new THREE.Audio(listener);
const wood_step_3_sound = new THREE.Audio(listener);
const wood_step_4_sound = new THREE.Audio(listener);

// Door sounds

const door_open_sound = new THREE.Audio(listener)
const door_close_sound = new THREE.Audio(listener)

// Build sounds

const build_sound = new THREE.Audio(listener)

const axeSounds = [
    axe_hit_1_sound,
    axe_hit_2_sound,
    axe_hit_3_sound
]

const grassStepSounds = [
	grass_step_sound
]

const woodStepSounds = [
	wood_step_1_sound,
	wood_step_2_sound,
	wood_step_3_sound,
	wood_step_4_sound
]

const audioLoader = new THREE.AudioLoader();

audioLoader.load( '/audio/pistol_shot_2.mp3', function( buffer ) {
	pistol_shoot_sound.setBuffer( buffer );
	pistol_shoot_sound.setLoop( false );
	pistol_shoot_sound.setVolume( 0.3 );
});

audioLoader.load( '/audio/ambience.mp3', function( buffer ) {
	ambience_sound.setBuffer( buffer );
	ambience_sound.setLoop( true );
	ambience_sound.setVolume( 0.225 );
    ambience_sound.play()
});

audioLoader.load( '/audio/reload.mp3', function( buffer ) {
	pistol_reload_sound.setBuffer( buffer );
	pistol_reload_sound.setLoop( false );
	pistol_reload_sound.setVolume( 0.75 );
});

audioLoader.load( '/audio/impact2.mp3', function( buffer ) {
	bullet_impact_sound.setBuffer( buffer );
	bullet_impact_sound.setLoop( false );
	bullet_impact_sound.setVolume( 0.4 );
});

audioLoader.load( '/audio/grass_step2.mp3', function( buffer ) {
	grass_step_sound.setBuffer( buffer );
	grass_step_sound.setLoop( false );
	grass_step_sound.setVolume( 0.2 );
});

audioLoader.load( '/audio/tree_fall.mp3', function( buffer ) {
	tree_fall_sound.setBuffer( buffer );
	tree_fall_sound.setLoop( false );
	tree_fall_sound.setVolume( 0.5 );
});

audioLoader.load( '/audio/axe_hit_1.mp3', function( buffer ) {
	axe_hit_1_sound.setBuffer( buffer );
	axe_hit_1_sound.setLoop( false );
	axe_hit_1_sound.setVolume( 1 );
});

audioLoader.load( '/audio/axe_hit_2.mp3', function( buffer ) {
	axe_hit_2_sound.setBuffer( buffer );
	axe_hit_2_sound.setLoop( false );
	axe_hit_2_sound.setVolume( 1 );
});

audioLoader.load( '/audio/axe_hit_3.mp3', function( buffer ) {
	axe_hit_3_sound.setBuffer( buffer );
	axe_hit_3_sound.setLoop( false );
	axe_hit_3_sound.setVolume( 1 );
});


//wood steps
audioLoader.load( '/audio/wood_step1.mp3', function( buffer ) {
	wood_step_1_sound.setBuffer( buffer );
	wood_step_1_sound.setLoop( false );
	wood_step_1_sound.setVolume( 0.5 );
});

audioLoader.load( '/audio/wood_step2.mp3', function( buffer ) {
	wood_step_2_sound.setBuffer( buffer );
	wood_step_2_sound.setLoop( false );
	wood_step_2_sound.setVolume( 0.5 );
});

audioLoader.load( '/audio/wood_step3.mp3', function( buffer ) {
	wood_step_3_sound.setBuffer( buffer );
	wood_step_3_sound.setLoop( false );
	wood_step_3_sound.setVolume( 0.5 );
});

audioLoader.load( '/audio/wood_step4.mp3', function( buffer ) {
	wood_step_4_sound.setBuffer( buffer );
	wood_step_4_sound.setLoop( false );
	wood_step_4_sound.setVolume( 0.5 );
});

audioLoader.load( '/audio/door_open.mp3', function( buffer ) {
	door_open_sound.setBuffer( buffer );
	door_open_sound.setLoop( false );
	door_open_sound.setVolume( 0.5 );
});

audioLoader.load( '/audio/door_close.mp3', function( buffer ) {
	door_close_sound.setBuffer( buffer );
	door_close_sound.setLoop( false );
	door_close_sound.setVolume( 0.5 );
});

audioLoader.load( '/audio/build_sound.mp3', function( buffer ) {
	build_sound.setBuffer( buffer );
	build_sound.setLoop( false );
	build_sound.setVolume( 0.5 );
});

export {
    listener,
    pistol_shoot_sound,
    pistol_reload_sound,
    bullet_impact_sound,
    ambience_sound,
    grass_step_sound,
    tree_fall_sound,
    axeSounds,
	woodStepSounds,
	grassStepSounds,
	door_open_sound,
	door_close_sound,
	build_sound,
};