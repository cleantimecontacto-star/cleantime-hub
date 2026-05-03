import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Sparkles, CheckCircle, Clock, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center text-white font-bold text-sm">C</div>
            <span className="font-semibold text-slate-900 dark:text-white text-lg">Cleantime</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
            <a href="#servicios" className="hover:text-sky-600 transition-colors">Servicios</a>
            <a href="#nosotros" className="hover:text-sky-600 transition-colors">Nosotros</a>
            <a href="#contacto" className="hover:text-sky-600 transition-colors">Contacto</a>
          </nav>
          <Link to="/login">
            <Button size="sm" className="bg-sky-600 hover:bg-sky-700 text-white">
              Acceder al sistema
            </Button>
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 text-sky-600 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Servicios profesionales de limpieza
          </span>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-slate-900 dark:text-white">
            Espacios impecables,{" "}
            <span className="italic text-sky-600">resultados que se notan</span>
          </h1>
          <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10">
            Limpieza fina y post construcción con los más altos estándares de calidad.
            Dejamos cada rincón listo para que lo disfrutes.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#contacto">
              <Button size="lg" className="bg-sky-600 hover:bg-sky-700 text-white px-8">
                Solicitar cotización
              </Button>
            </a>
            <a href="#servicios">
              <Button size="lg" variant="outline" className="px-8">
                Ver servicios
              </Button>
            </a>
          </div>
          <div className="mt-12 inline-flex items-center gap-2 text-slate-400 text-sm">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span>100% Satisfacción garantizada</span>
          </div>
        </div>
      </section>

      {/* SERVICIOS */}
      <section id="servicios" className="py-20 px-4 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-sky-600 text-sm font-medium">Nuestros servicios</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 text-slate-900 dark:text-white">
              Limpieza especializada<br />para cada necesidad
            </h2>
            <p className="mt-4 text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Contamos con equipos capacitados y productos profesionales para cada tipo de trabajo.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Limpieza Fina",
                desc: "Limpieza detallada y exhaustiva de interiores. Cuidamos cada superficie, mueble y rincón de tu hogar u oficina con productos de alta calidad.",
                badge: "Residencial & Comercial",
                emoji: "✨",
              },
              {
                title: "Limpieza Post Construcción",
                desc: "Retiro completo de escombros, polvo de obra, residuos de pintura, sello y más. Dejamos tu proyecto recién construido listo para habitar.",
                badge: "Obras & Remodelaciones",
                emoji: "🏗️",
              },
              {
                title: "Sanitización y Desinfección",
                desc: "Aplicación de productos desinfectantes certificados para ambientes libres de gérmenes y bacterias. Ideal para empresas, clínicas y hogares.",
                badge: "Residencial & Empresas",
                emoji: "🧴",
              },
            ].map((s) => (
              <div key={s.title} className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">{s.emoji}</div>
                <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">{s.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-4">{s.desc}</p>
                <span className="inline-block text-xs font-medium px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400">{s.badge}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GALERÍA DE TRABAJOS */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-sky-600 text-sm font-medium">Nuestros trabajos</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 text-slate-900 dark:text-white">
              Resultados que hablan<br />por sí solos
            </h2>
            <p className="mt-4 text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Cada trabajo es una muestra de nuestro compromiso con la limpieza profesional.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="overflow-hidden rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <img
                src="/gallery/trabajo-1.jpg"
                alt="Limpieza exterior - jardines y áreas comunes"
                className="w-full h-64 object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="overflow-hidden rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <img
                src="/gallery/trabajo-2.jpg"
                alt="Limpieza de terraza y espacios al aire libre"
                className="w-full h-64 object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="overflow-hidden rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <img
                src="/gallery/trabajo-3.jpg"
                alt="Limpieza de pasillos y áreas interiores"
                className="w-full h-64 object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* POR QUÉ ELEGIRNOS */}
      <section id="nosotros" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-sky-600 text-sm font-medium">¿Por qué elegirnos?</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 text-slate-900 dark:text-white">
              Compromiso con la calidad<br />en cada trabajo
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Users className="w-6 h-6" />, title: "Personal capacitado", desc: "Equipo profesional, verificado y con experiencia en limpieza especializada." },
              { icon: <CheckCircle className="w-6 h-6" />, title: "Productos certificados", desc: "Usamos insumos de limpieza profesionales, biodegradables y seguros." },
              { icon: <Clock className="w-6 h-6" />, title: "Puntualidad garantizada", desc: "Respetamos tus horarios. Llegamos a tiempo y terminamos según lo acordado." },
              { icon: <Star className="w-6 h-6" />, title: "Atención personalizada", desc: "Adaptamos el servicio a tus necesidades específicas y presupuesto." },
            ].map((f) => (
              <div key={f.title} className="p-6 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-sky-200 dark:hover:border-sky-800 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 mb-4">
                  {f.icon}
                </div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">{f.title}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-sky-600">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            ¿Listo para un espacio impecable?
          </h2>
          <p className="text-sky-100 mb-8">
            Solicita tu cotización sin compromiso. Respondemos en menos de 24 horas.
          </p>
          <a href="#contacto">
            <Button size="lg" className="bg-white text-sky-600 hover:bg-sky-50 px-10 font-semibold">
              Cotizar ahora →
            </Button>
          </a>
        </div>
      </section>

      {/* CONTACTO */}
      <section id="contacto" className="py-20 px-4 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-sky-600 text-sm font-medium">Contáctanos</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 text-slate-900 dark:text-white">
              Hablemos de tu proyecto
            </h2>
            <p className="mt-4 text-slate-500 dark:text-slate-400">
              Completa el formulario o escríbenos directamente. Estamos para ayudarte.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center text-sky-600">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Teléfono</p>
                  <a href="tel:+56952396823" className="font-medium text-slate-900 dark:text-white hover:text-sky-600 transition-colors">+56 9 5239 6823</a>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center text-sky-600">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Correo electrónico</p>
                  <a href="mailto:cleantime.contacto@gmail.com" className="font-medium text-slate-900 dark:text-white hover:text-sky-600 transition-colors">cleantime.contacto@gmail.com</a>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center text-sky-600">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Cobertura</p>
                  <p className="font-medium text-slate-900 dark:text-white">Región Metropolitana, Chile</p>
                </div>
              </div>
              <a
                href="https://wa.me/56952396823?text=Hola%20Cleantime!%20Me%20interesa%20cotizar%20un%20servicio%20de%20limpieza%20🧹"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="w-full bg-green-500 hover:bg-green-600 text-white mt-4">
                  Contactar por WhatsApp
                </Button>
              </a>
            </div>
            <ContactForm />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 px-4 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-sky-600 flex items-center justify-center text-white font-bold text-xs">C</div>
            <span>Cleantime © {new Date().getFullYear()}</span>
          </div>
          <span>Servicios profesionales de limpieza — Región Metropolitana, Chile</span>
          <Link to="/login" className="text-sky-600 hover:underline">
            Acceso al sistema →
          </Link>
        </div>
      </footer>
    </div>
  );
}

function ContactForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("https://formspree.io/f/cleantime", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="p-8 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <p className="font-medium text-green-700 dark:text-green-400">✓ Mensaje enviado. Te contactaremos pronto.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Correo electrónico</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mensaje</label>
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          placeholder="Cuéntanos qué necesitas..."
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition resize-none"
        />
      </div>
      {error && (
        <p className="text-sm text-red-500">⚠ Error al enviar. Intenta por WhatsApp.</p>
      )}
      <Button type="submit" disabled={loading} className="w-full bg-sky-600 hover:bg-sky-700 text-white">
        {loading ? "Enviando..." : "Enviar mensaje →"}
      </Button>
    </form>
  );
}
