import '../../styles/client/Home.css'

export default function ClientHome() {
  return (
    <div className="client-page">
      <section className="welcome">
        <h1>Bienvenido a VinylVibe</h1>
        <p className="tagline">Una tienda online para comprar vinilos de colección dirigida a expertos y coleccionistas amantes de los vinilos</p>
      </section>

      <section className="values">
        <div className="value-card">
          <div className="value-card-inner">
            <h3>Misión</h3>
            <p>Proporcionar a los coleccionistas de vinilos acceso a una curated selection de álbumes raros y clásicos, con autenticidad garantizada.</p>
            <div className="card-decoration"></div>
          </div>
        </div>

        <div className="value-card">
          <div className="value-card-inner">
            <h3>Visión</h3>
            <p>Cada vinilo cuenta una historia. Nosotros cuidamos que esa historia sea auténtica, impecable y perdure en el tiempo. Porque lo que importa es la conexión que creas con la música.</p>
            <div className="card-decoration"></div>
          </div>
        </div>

        <div className="value-card">
          <div className="value-card-inner">
            <h3>Valores</h3>
            <p>Autenticidad, Pasión por la música, Excelencia en servicio, Comunidad, Sostenibilidad.</p>
            <div className="card-decoration"></div>
          </div>
        </div>
      </section>
    </div>
  )
}
