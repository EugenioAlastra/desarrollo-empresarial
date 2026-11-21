/* Traducción al inglés del contenido del plan (títulos, descripciones, fases, bloques).
   Se aplica en el arranque si el idioma es inglés. El original en español se guarda en s.o. */
(function () {
  const FASES = {
    'Principios': ['Principles', 'How great founders think and decide: Munger, Buffett, Jobs, Walton and Ford.'],
    'Empresas': ['Companies', 'Why they win in the long run: Berkshire, Walmart, Costco, TSMC and Amazon.'],
    'Finanzas y valuación': ['Finance and valuation', 'What a business is worth and what risk I am taking: Damodaran and Howard Marks.'],
    'Estrategia y construcción': ['Strategy and building', 'How a company is built and how it defends itself: Y Combinator, Stratechery, Visa, Nvidia.']
  };
  const BLOQUES = {
    'Munger I': ['Munger I', 'How Charlie Munger thinks'],
    'Munger II': ['Munger II', 'Munger in his own words'],
    'Buffett I': ['Buffett I', 'How Buffett picks businesses and managers'],
    'Buffett II': ['Buffett II', 'The Berkshire annual letter (primary source)'],
    'Steve Jobs I': ['Steve Jobs I', 'Product, taste and simplicity'],
    'Steve Jobs II': ['Steve Jobs II', 'Jobs’s principles in his own words'],
    'Operadores': ['Operators', 'Walton and Ford: flow, standardization and logistics'],
    'Berkshire I': ['Berkshire I', 'The story of Berkshire (part I)'],
    'Berkshire II': ['Berkshire II', 'How Berkshire finds and reinvests capital'],
    'Walmart': ['Walmart', 'Operating costs and scale'],
    'Costco': ['Costco', 'Membership, margin and logistics'],
    'Manufactura': ['Manufacturing', 'TSMC and the split between design and fabrication'],
    'Operaciones y mejora continua': ['Operations and continuous improvement', 'Toyota, lean and the theory of constraints'],
    'Plataformas': ['Platforms', 'Amazon and its virtuous circle'],
    'Marco de valuación': ['Valuation framework', 'Bias, intrinsic value and relative value'],
    'Costo de capital': ['Cost of capital', 'Risk-free rate, risk premium, betas'],
    'Flujos y valor terminal': ['Cash flows and terminal value', 'Cash flows, growth and terminal value'],
    'Riesgo y juicio': ['Risk and judgment', 'Howard Marks memos'],
    'Construir desde cero I': ['Building from scratch I', 'Idea and product'],
    'Construir desde cero II': ['Building from scratch II', 'Sales and hiring'],
    'Estrategia I': ['Strategy I', 'Aggregation Theory and competitive advantage'],
    'Estrategia II': ['Strategy II', 'Visa and Microsoft'],
    'Nvidia I': ['Nvidia I', 'The initial bet'],
    'Nvidia II': ['Nvidia II', 'Long-term bets'],
    'Síntesis': ['Synthesis', 'Closing the Principles Manual']
  };
  const TIT = {
    'Founders #295 · Cena con Charlie Munger': 'Founders #295 · Dinner with Charlie Munger',
    'Founders #329 · El nuevo Poor Charlie\'s Almanack': 'Founders #329 · The new Poor Charlie\'s Almanack',
    'Modelos mentales (Farnam Street)': 'Mental models (Farnam Street)',
    'Práctica de la semana': 'Weekly practice',
    'Founders #286 · Buffett y Munger': 'Founders #286 · Buffett and Munger',
    'Founders #380 · 400 páginas de Buffett y Munger': 'Founders #380 · 400 pages of Buffett and Munger',
    'Founders #279 · Lo que aprendí antes de venderle a Buffett': 'Founders #279 · What I learned before selling to Buffett',
    'Carta anual 2025 de Berkshire': 'Berkshire 2025 annual letter',
    'Founders #19 · Becoming Steve Jobs (reemplaza al #5, que no está en YouTube)': 'Founders #19 · Becoming Steve Jobs (replaces #5, which is not on YouTube)',
    'Founders #390 · Entrevista rara de Steve Jobs (1985)': 'Founders #390 · Rare Steve Jobs interview (1985)',
    'Founders #281 · Trabajar con Steve Jobs': 'Founders #281 · Working with Steve Jobs',
    'Founders #398 · Steve Jobs en sus palabras (Make Something Wonderful)': 'Founders #398 · Steve Jobs in his own words (Make Something Wonderful)',
    'Founders #349 · Cómo Steve Jobs simplificaba': 'Founders #349 · How Steve Jobs simplified',
    'Founders #350 · Vender como Steve Jobs': 'Founders #350 · Selling like Steve Jobs',
    'Founders · Ed Catmull (Pixar), reemplaza al #235': 'Founders · Ed Catmull (Pixar), replaces #235',
    'Founders · Sam Walton (reemplaza al #6)': 'Founders · Sam Walton (replaces #6)',
    'Founders · Henry Ford, autobiografía (reemplaza al #9)': 'Founders · Henry Ford, autobiography (replaces #9)',
    'Sistema de Producción Toyota (video oficial de Toyota)': 'Toyota Production System (official Toyota video)',
    'Rami Goldratt · Los 4 pilares de la Teoría de las Restricciones': 'Rami Goldratt · The 4 pillars of the Theory of Constraints',
    'La Meta (Goldratt), versión instructiva': 'The Goal (Goldratt), instructional version',
    'Toda la historia de Toyota en 22 minutos': 'The whole story of Toyota in 22 minutes',
    'Sitio de Damodaran (clases, datos y planillas)': 'Damodaran’s site (classes, data and spreadsheets)',
    'Datos por sector de Damodaran': 'Damodaran’s data by sector',
    'Damodaran · Clase 2: El triángulo de las Bermudas de la valuación': 'Damodaran · Class 2: The Bermuda Triangle of valuation',
    'Damodaran · Clase 4: El panorama del DCF': 'Damodaran · Class 4: The DCF big picture',
    'Damodaran · Clase 5: Tasas libres de riesgo y primas de riesgo': 'Damodaran · Class 5: Risk-free rates and risk premiums',
    'Damodaran · Clase 6: Primas de riesgo implícitas': 'Damodaran · Class 6: Implied risk premiums',
    'Damodaran · Clase 7: Betas y costo de capital': 'Damodaran · Class 7: Betas and cost of capital',
    'Damodaran · Clase 8: Deuda en el costo de capital': 'Damodaran · Class 8: Debt in the cost of capital',
    'Damodaran · Clase 9: Impuestos, capex y capital de trabajo': 'Damodaran · Class 9: Taxes, capex and working capital',
    'Damodaran · Clase 11: Crecimiento': 'Damodaran · Class 11: Growth',
    'Damodaran · Clase 12: El valor terminal': 'Damodaran · Class 12: Terminal value',
    'Damodaran · Clase 13: Cabos sueltos de la valuación': 'Damodaran · Class 13: Loose ends of a valuation',
    'Damodaran · Clase 16: Valuar el mercado y empresas jóvenes': 'Damodaran · Class 16: Valuing the market and young companies',
    'Startup School · Cómo conseguir y evaluar ideas': 'Startup School · How to get and evaluate ideas',
    'Michael Seibel · Construir el producto': 'Michael Seibel · Building the product',
    'Startup School · Cómo hablar con usuarios': 'Startup School · How to talk to users',
    'Startup School · Cómo conseguir tus primeros clientes': 'Startup School · How to get your first customers',
    'Startup School · El manual de ventas para fundadores': 'Startup School · The sales playbook for founders',
    'Y Combinator · Errores de contratación a evitar': 'Y Combinator · Hiring mistakes to avoid',
    'Startup School · Cómo convertir clientes con cold emails': 'Startup School · How to win customers with cold emails',
    'Startup School · Ventas enterprise': 'Startup School · Enterprise sales',
    'Y Combinator · Cómo contratar los primeros ingenieros y vendedores': 'Y Combinator · How to hire your first engineers and salespeople',
    'Stratechery · un artículo semanal gratuito a elección': 'Stratechery · a free weekly article of your choice',
    'Acquired · Entrevista a Jensen Huang': 'Acquired · Interview with Jensen Huang',
    'Acquired · Morris Chang, fundador de TSMC': 'Acquired · Morris Chang, founder of TSMC',
    'Acquired · Microsoft Volumen I': 'Acquired · Microsoft Volume I',
    'Not Boring · un análisis profundo a elección': 'Not Boring · a deep dive of your choice',
    'Relectura de tus notas': 'Rereading your notes',
    'Manual de principios final': 'Final Principles Manual'
  };
  const FUENTE = { 'Práctica propia': 'Own practice', 'Cierre de fase': 'Phase wrap-up' };
  const BOTON = { 'Abrir en YouTube': 'Open on YouTube', 'Abrir la página': 'Open the page', 'Abrir cartas': 'Open letters', 'Abrir episodio': 'Open episode', 'Abrir memos': 'Open memos', 'Abrir artículos': 'Open articles', 'Abrir Not Boring': 'Open Not Boring' };
  const DESC = {
    'Leé los modelos que más se repiten en Munger.': 'Read the mental models that come up most often in Munger.',
    'Anotá 8 principios de Munger, cada uno con un ejemplo de tu vida o de una empresa.': 'Write down 8 Munger principles, each with an example from your life or from a company.',
    'Analizá una decisión reciente tuya con 3 de tus principios de Munger.': 'Analyze a recent decision of yours using 3 of your Munger principles.',
    'Resumí en una página cómo elige Buffett un negocio y un gerente.': 'Summarize on one page how Buffett chooses a business and a manager.',
    'En esa página buscá la carta más reciente (2025, primera de Greg Abel). Leé el primer tercio de la carta y anotá ideas.': 'On that page find the most recent letter (2025, Greg Abel’s first). Read the first third of the letter and write down ideas.',
    'En esa página buscá la carta más reciente (2025, primera de Greg Abel). Leé el segundo tercio de la carta y anotá ideas.': 'On that page find the most recent letter (2025, Greg Abel’s first). Read the second third of the letter and write down ideas.',
    'En esa página buscá la carta más reciente (2025, primera de Greg Abel). Leé el último tercio de la carta y anotá ideas.': 'On that page find the most recent letter (2025, Greg Abel’s first). Read the last third of the letter and write down ideas.',
    'Anotá 5 ideas de la carta con su evidencia y su aplicación.': 'Write down 5 ideas from the letter with their evidence and application.',
    'Tomá un producto o servicio que uses y escribí qué eliminarías para simplificarlo.': 'Take a product or service you use and write what you would remove to simplify it.',
    'Escribí en 5 líneas, sin adjetivos, la propuesta de valor de una idea propia.': 'Write the value proposition of an idea of your own in 5 lines, without adjectives.',
    'Explicá qué principio de ingeniería industrial usa cada uno: flujo, estandarización o logística.': 'Explain which industrial engineering principle each one uses: flow, standardization or logistics.',
    'Pedile a Claude el cuestionario de opción múltiple de la Fase 1 (se corrige después de que respondas; meta: 80% o más). Entregable: Manual de principios v1 (1 página).': 'Ask Claude for the Phase 1 multiple-choice quiz (it is graded after you answer; goal: 80% or more). Deliverable: Principles Manual v1 (1 page).',
    'Anotá 5 decisiones de Buffett de la Parte I con su evidencia.': 'Write down 5 Buffett decisions from Part I with their evidence.',
    'Dibujá cómo Berkshire consigue capital y a dónde lo reinvierte (con lo que viste de la Parte I y de la carta anual).': 'Draw how Berkshire raises capital and where it reinvests it (using what you saw in Part I and in the annual letter).',
    'Escribí 5 decisiones operativas de Walmart que bajaron sus costos (repasá antes tus notas de Sam Walton).': 'Write 5 operating decisions at Walmart that lowered its costs (first review your Sam Walton notes).',
    'Compará Walmart y Costco en costo, margen y logística, y señalá qué decisión explica cada ventaja.': 'Compare Walmart and Costco on cost, margin and logistics, and point out which decision explains each advantage.',
    'Escribí por qué separar el diseño de la fabricación creó una industria nueva.': 'Write why separating design from manufacturing created a new industry.',
    'Mapeá un proceso real (de tu pasantía o de la facultad): marcá 3 desperdicios (muda) y el cuello de botella, y proponé 1 mejora.': 'Map a real process (from your internship or university): mark 3 wastes (muda) and the bottleneck, and propose 1 improvement.',
    'Dibujá el círculo virtuoso de Amazon en cinco pasos.': 'Draw Amazon’s virtuous circle in five steps.',
    'Pedile a Claude el cuestionario de opción múltiple de las Fases 1 y 2 (Berkshire a Amazon) (se corrige después de que respondas; meta: 80% o más). Entregable: memo de una página con la ventaja competitiva de la empresa que más te impactó.': 'Ask Claude for the multiple-choice quiz on Phases 1 and 2 (Berkshire to Amazon) (it is graded after you answer; goal: 80% or more). Deliverable: a one-page memo on the competitive advantage of the company that impressed you most.',
    'Explorá el sitio y guardá la lista de planillas.': 'Explore the site and save the list of spreadsheets.',
    'Hacé el test de sesgo de la clase y anotá qué sesgo te descubrís.': 'Take the class bias test and write down which bias you discover in yourself.',
    'Descargá prima implícita, betas y costo de capital por sector.': 'Download implied premium, betas and cost of capital by sector.',
    'Elegí una empresa que ya sigas y calculá su costo de capital con los datos sectoriales.': 'Pick a company you already follow and compute its cost of capital with the sector data.',
    'Armá la proyección de flujos de esa empresa y calculá su valor (parte 1 de 2).': 'Build that company’s cash-flow projection and compute its value (part 1 of 2).',
    'Terminá la proyección y el valor de la empresa (parte 2 de 2).': 'Finish the projection and the company’s value (part 2 of 2).',
    'Sugerencia: «You Can\'t Predict. You Can Prepare.». Buscalo en la lista de memos (o elegí otro). Leé y anotá ideas.': 'Suggestion: “You Can’t Predict. You Can Prepare.” Find it in the memo list (or pick another). Read and write down ideas.',
    'Sugerencia: «Risk Revisited Again». Buscalo en la lista de memos (o elegí otro). Leé y anotá ideas.': 'Suggestion: “Risk Revisited Again”. Find it in the memo list (or pick another). Read and write down ideas.',
    'Sugerencia: «Sea Change». Buscalo en la lista de memos (o elegí otro). Leé y anotá ideas.': 'Suggestion: “Sea Change”. Find it in the memo list (or pick another). Read and write down ideas.',
    'Compará tu valuación con el precio de mercado y anotá los 3 supuestos que más mueven el resultado.': 'Compare your valuation with the market price and write down the 3 assumptions that move the result most.',
    'Pedile a Claude el cuestionario de opción múltiple de la Fase 3 (se corrige después de que respondas; meta: 80% o más). Entregable: la valuación completa y el Manual de principios v2.': 'Ask Claude for the Phase 3 multiple-choice quiz (it is graded after you answer; goal: 80% or more). Deliverable: the full valuation and Principles Manual v2.',
    'Escribí en una página el problema, el cliente y la hipótesis de una empresa propia.': 'Write on one page the problem, the customer and the hypothesis of a company of your own.',
    'Escribí cómo conseguirías tus primeros 10 clientes.': 'Write how you would get your first 10 customers.',
    'Armá un guion de entrevista de descubrimiento con 5 preguntas y probalo con 2 personas reales (un dueño de pyme, por ejemplo).': 'Build a discovery-interview script with 5 questions and try it with 2 real people (a small-business owner, for example).',
    'Leé el artículo completo y anotá la idea central.': 'Read the whole article and write down the core idea.',
    'Leé el artículo completo y compará con el de 2015.': 'Read the whole article and compare it with the 2015 one.',
    'Elegí un artículo semanal gratis de la lista y leelo.': 'Pick a free weekly article from the list and read it.',
    'Analizá una empresa en cuatro preguntas: quién es el cliente, qué vende, dónde gana costo y qué barrera la protege.': 'Analyze a company with four questions: who the customer is, what it sells, where it wins on cost and what barrier protects it.',
    'Respondé las cuatro preguntas de la semana anterior para Visa (o para otra empresa del plan).': 'Answer last week’s four questions for Visa (or for another company in the plan).',
    'Anotá la apuesta inicial de Nvidia y qué riesgo asumió.': 'Write down Nvidia’s initial bet and what risk it took.',
    'Escribí qué apuestas de largo plazo hizo Nvidia y cómo sostuvo la espera (usá la Parte I si no escuchaste la II).': 'Write what long-term bets Nvidia made and how it sustained the wait (use Part I if you did not listen to II).',
    'Elegí un ensayo de la lista de favoritos y leelo (puede llevar 2 sesiones).': 'Pick an essay from the favorites list and read it (it may take 2 sessions).',
    'Releé todas tus notas desde la pestaña Estadísticas → Cuadro sinóptico.': 'Reread all your notes from the Statistics tab → Synoptic chart.',
    'Cerrá el Manual de principios final de 2 a 3 páginas.': 'Finish the final Principles Manual, 2 to 3 pages.',
    'Pedile a Claude el cuestionario de opción múltiple de todo el plan (examen integrador de 25 preguntas) (se corrige después de que respondas; meta: 80% o más). Entregable: defensa escrita de una página: qué harías distinto en una empresa real y con qué evidencia.': 'Ask Claude for the multiple-choice quiz on the whole plan (25-question final exam) (it is graded after you answer; goal: 80% or more). Deliverable: a one-page written defense: what you would do differently in a real company and with what evidence.'
  };
  const PREFIX = [
    [/^Mirá del minuto (\d+) al (\d+)\. Pausá cuando algo te sirva y anotá una idea con la plantilla\.\s*/, (m) => 'Watch from minute ' + m[1] + ' to ' + m[2] + '. Pause when something is useful and write down an idea with the template. '],
    [/^Mirá del minuto (\d+) al (\d+)\. Hacé el test de sesgo de la clase\.$/, (m) => 'Watch from minute ' + m[1] + ' to ' + m[2] + '. Take the class bias test.'],
    [/^Mirá el video completo \((\d+) min\)\. Pausá cuando algo te sirva y anotá una idea con la plantilla\.\s*/, (m) => 'Watch the full video (' + m[1] + ' min). Pause when something is useful and write down an idea with the template. '],
    [/^Escuchá 30 minutos desde donde dejaste \(aprox\. minutos (\d+) a (\d+); la duración exacta no figura en la página\)\. Pausá cuando algo te sirva y anotá una idea con la plantilla\.\s*/, (m) => 'Listen for 30 minutes from where you left off (approx. minutes ' + m[1] + ' to ' + m[2] + '; the exact length is not on the page). Pause when something is useful and write down an idea with the template. ']
  ];
  const ROM = (s) => s;
  function titulo(t) {
    let suf = '', b = t;
    let m;
    if ((m = b.match(/ \(parte (\d+) de (\d+)\)$/))) { suf = ' (part ' + m[1] + ' of ' + m[2] + ')'; b = b.slice(0, m.index); }
    else if ((m = b.match(/ \((\d+) de (\d+)\)$/))) { suf = ' (' + m[1] + ' of ' + m[2] + ')'; b = b.slice(0, m.index); }
    else if ((m = b.match(/ \(sesión (\d+) de (~?\d+)\)$/))) { suf = ' (session ' + m[1] + ' of ' + m[2] + ')'; b = b.slice(0, m.index); }
    else if ((m = b.match(/ (\d+) de (\d+)$/))) { suf = ' ' + m[1] + ' of ' + m[2]; b = b.slice(0, m.index); }
    if (TIT[b]) b = TIT[b];
    else {
      b = b.replace(/^Memo de Howard Marks$/, 'Howard Marks memo').replace(/ Parte (I+)\b/, ' Part $1').replace(/^Checkpoint (\d)$/, 'Checkpoint $1');
    }
    return b + suf;
  }
  function desc(d) {
    for (const [rx, f] of PREFIX) { const m = d.match(rx); if (m) { const rest = d.slice(m[0].length); return f(m) + (rest ? (DESC[rest] || rest) : '').trim(); } }
    return DESC[d] || d;
  }
  window.I18N = {
    aplicar(P) {
      P.fases.forEach(f => { const x = FASES[f.nombre]; if (x) { f.o = { nombre: f.nombre, pregunta: f.pregunta }; f.nombre = x[0]; f.pregunta = x[1]; } });
      P.bloques.forEach(b => { const x = BLOQUES[b.nombre]; if (x) { b.o = { nombre: b.nombre, pregunta: b.pregunta }; b.nombre = x[0]; b.pregunta = x[1]; } });
      P.sesiones.forEach(s => {
        s.o = { titulo: s.titulo, desc: s.desc, fuente: s.fuente, boton: s.boton };
        s.titulo = titulo(s.titulo); s.desc = desc(s.desc);
        s.fuente = FUENTE[s.fuente] || s.fuente; s.boton = BOTON[s.boton] || s.boton;
      });
    }
  };
})();
