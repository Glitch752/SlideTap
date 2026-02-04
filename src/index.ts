import './styles/index.scss';
import { Sounds } from './Sounds';
import App from './App.svelte';
import { mount } from 'svelte';

Sounds.init();

mount(App, {
    target: document.getElementById("root")!,
    props: {}
});