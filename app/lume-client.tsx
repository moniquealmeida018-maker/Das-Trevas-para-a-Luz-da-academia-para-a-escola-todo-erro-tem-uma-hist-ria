"use client";

import { useEffect } from "react";

export default function LumeClient() {
  useEffect(() => {
    let active = true;
    const load = (src: string) => new Promise<void>((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
      document.body.appendChild(script);
    });
    load("/assets/references.js?v=variation-references-10")
      .then(() => load("/assets/questions.js?v=bncc-audit-17"))
      .then(() => active && load("/assets/app.js?v=interactive-comic-12"));
    return () => { active = false; };
  }, []);

  return <>
    <a className="skip" href="#app">Pular para o conteúdo</a>
    <header>
      <button className="brand" data-page="home">✦ Das trevas para a luz, da academia para a escola: todo “erro” tem uma história</button>
      <button className="menu" aria-expanded="false" aria-controls="main-navigation">Menu</button>
      <nav id="main-navigation">
        <button data-page="student">Sou aluno</button><button data-page="studentprogress">Progresso</button><button data-page="teacher">Sou professor</button>
        <button data-page="institutional">Institucional</button><button data-page="participants">Participantes</button>
        <button data-page="ai">IA no site</button><button data-page="sources">Referências</button>
        <button data-page="contact">Contato</button><button id="contrast" aria-label="Ativar alto contraste">◐</button>
      </nav>
    </header>
    <main id="app" tabIndex={-1} />
    <footer><span>Mudança; Sociolinguística; Variação</span>
      <a className="footerlicense" href="https://creativecommons.org/licenses/by/4.0/deed.pt-br" target="_blank" rel="license noopener noreferrer">CC BY 4.0 ↗</a>
      <button data-page="sources">Referências e créditos</button>
    </footer>
  </>;
}
