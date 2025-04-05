"use client";

import { useState, useEffect, useRef } from "react";
import smlogo from "../assets/images/SMlogo.png";
import { motion, useAnimation, useInView } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Phone,
  Mail,
  Globe,
  MapPin,
  ArrowRight,
} from "lucide-react";

// Animation component for sections
const AnimatedSection = ({ children, delay = 0 }) => {
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [controls, isInView]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.6,
            ease: "easeOut",
            delay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
};

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const carouselItems = [
    {
      image: "https://placehold.co/1920x1080",
      title: "Building Dreams, Delivering Precision",
      description:
        "India's first modular furniture e-commerce platform delivering speed, precision, and quality.",
    },
    {
      image: "https://placehold.co/1920x1080",
      title: "Premium Modular Furniture",
      description:
        "Fulfilling all your modular furniture needs within your budget with unmatched quality.",
    },
    {
      image: "https://placehold.co/1920x1080",
      title: "Tech-First Approach",
      description:
        "Redefining modular furniture with precision engineering and hassle-free services.",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) =>
        prev === carouselItems.length - 1 ? 0 : prev + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) =>
      prev === carouselItems.length - 1 ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setCurrentSlide((prev) =>
      prev === 0 ? carouselItems.length - 1 : prev - 1
    );
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 py-4 px-6 md:px-12 sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <img src={smlogo} alt="Company Logo" className="h-12 w-auto" />
            {/* <span className="ml-3 text-2xl font-bold">
              <span className="text-black">Sanmay</span>
              <span style={{ color: "#cf9646" }}>Modutech</span>
            </span> */}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-black focus:outline-none"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            <a
              href="#about"
              className="text-black hover:text-[#cf9646] font-medium transition-colors duration-300"
            >
              About
            </a>
            <a
              href="#services"
              className="text-black hover:text-[#cf9646] font-medium transition-colors duration-300"
            >
              Services
            </a>
            <a
              href="#portfolio"
              className="text-black hover:text-[#cf9646] font-medium transition-colors duration-300"
            >
              Portfolio
            </a>
            <a
              href="#contact"
              className="text-black hover:text-[#cf9646] font-medium transition-colors duration-300"
            >
              Contact
            </a>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`md:hidden ${isMenuOpen ? "block" : "hidden"} mt-4`}>
          <div className="flex flex-col space-y-4 px-2">
            <a
              href="#about"
              className="text-black hover:text-[#cf9646] font-medium py-2 transition-colors duration-300"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </a>
            <a
              href="#services"
              className="text-black hover:text-[#cf9646] font-medium py-2 transition-colors duration-300"
              onClick={() => setIsMenuOpen(false)}
            >
              Services
            </a>
            <a
              href="#portfolio"
              className="text-black hover:text-[#cf9646] font-medium py-2 transition-colors duration-300"
              onClick={() => setIsMenuOpen(false)}
            >
              Portfolio
            </a>
            <a
              href="#contact"
              className="text-black hover:text-[#cf9646] font-medium py-2 transition-colors duration-300"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Carousel */}
      <div className="relative h-[80vh] overflow-hidden">
        {carouselItems.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{
              opacity: index === currentSlide ? 1 : 0,
              transition: { duration: 1 },
            }}
            className="absolute w-full h-full"
          >
            <div
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${item.image})` }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-60"></div>
              <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4">
                <motion.h1
                  className="text-4xl md:text-6xl font-bold text-white mb-6"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{
                    y: index === currentSlide ? 0 : 20,
                    opacity: index === currentSlide ? 1 : 0,
                  }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                >
                  {item.title}
                </motion.h1>
                <motion.p
                  className="text-xl md:text-2xl text-white max-w-3xl mb-8"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{
                    y: index === currentSlide ? 0 : 20,
                    opacity: index === currentSlide ? 1 : 0,
                  }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                >
                  {item.description}
                </motion.p>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{
                    y: index === currentSlide ? 0 : 20,
                    opacity: index === currentSlide ? 1 : 0,
                  }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                >
                  <a
                    href="#contact"
                    className="px-8 py-3 bg-[#cf9646] text-white font-medium rounded-sm hover:bg-[#b88339] transition-colors duration-300 inline-flex items-center"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </motion.div>
              </div>
            </div>
          </motion.div>
        ))}

        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-50 p-3 rounded-full transition-all duration-300 z-10"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-6 w-6 text-white" />
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-50 p-3 rounded-full transition-all duration-300 z-10"
          aria-label="Next slide"
        >
          <ChevronRight className="h-6 w-6 text-white" />
        </button>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-3 z-10">
          {carouselItems.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "bg-[#cf9646] w-10"
                  : "bg-white bg-opacity-50 hover:bg-opacity-80"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Featured Projects Section */}
      <section id="portfolio" className="py-20 px-6 md:px-12 bg-gray-50">
        <div className="container mx-auto">
          <AnimatedSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Featured Projects
              </h2>
              <div
                className="w-24 h-1 mx-auto"
                style={{ backgroundColor: "#cf9646" }}
              ></div>
              <p className="mt-6 text-gray-600 max-w-3xl mx-auto">
                Explore our latest interior design projects showcasing our
                commitment to excellence and attention to detail.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((item, index) => (
              <AnimatedSection key={index} delay={index * 0.1}>
                <div className="group relative overflow-hidden rounded-sm">
                  <img
                    src={`https://placehold.co/800x600`}
                    alt={`Project ${item}`}
                    className="w-full h-80 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="text-center p-4">
                      <h3 className="text-white text-xl font-bold mb-2">
                        Modern Living Room
                      </h3>
                      <p className="text-gray-200 mb-4">
                        Minimalist design with premium materials
                      </p>
                      <a
                        href="#"
                        className="inline-block px-6 py-2 border border-[#cf9646] text-[#cf9646] hover:bg-[#cf9646] hover:text-white transition-colors duration-300"
                        style={{ borderColor: "#cf9646", color: "#cf9646" }}
                      >
                        View Project
                      </a>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection delay={0.3}>
            <div className="text-center mt-12">
              <a
                href="#"
                className="inline-flex items-center font-medium transition-colors duration-300"
                style={{ color: "#cf9646" }}
              >
                View All Projects
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-6 md:px-12">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <AnimatedSection>
              <div className="relative">
                <img
                  src="https://placehold.co/600x800"
                  alt="About Us"
                  className="w-full h-auto rounded-sm"
                />
                <div
                  className="absolute -bottom-8 -right-8 p-6 rounded-sm hidden md:block"
                  style={{ backgroundColor: "#cf9646" }}
                >
                  <p className="text-white text-4xl font-bold">10+</p>
                  <p className="text-white">Years Experience</p>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  About Sanmay Modutech LLP
                </h2>
                <div
                  className="w-24 h-1 mb-8"
                  style={{ backgroundColor: "#cf9646" }}
                ></div>

                <p className="text-lg mb-6 text-gray-700">
                  A visionary organization committed to revolutionizing the
                  modular furniture industry with our brand{" "}
                  <span className="font-bold">Warsto</span> - India's first
                  modular furniture e-commerce platform delivering speed,
                  precision, and quality.
                </p>

                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-3">Our Vision</h3>
                  <p
                    className="italic border-l-4 pl-4 py-2 bg-gray-50"
                    style={{ borderLeftColor: "#cf9646" }}
                  >
                    "To fulfill all modular furniture needs within the
                    customer's budget while providing premium quality and an
                    unmatched experience."
                  </p>
                </div>

                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-3">Our Mission</h3>
                  <p
                    className="italic border-l-4 pl-4 py-2 bg-gray-50"
                    style={{ borderLeftColor: "#cf9646" }}
                  >
                    "To redefine modular furniture with a tech-first approach,
                    ensuring precision engineering, fastest delivery, and
                    hassle-free services."
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <div
                      className="p-1 rounded-full mr-3"
                      style={{ backgroundColor: "#cf9646" }}
                    >
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <span>Quality Excellence</span>
                  </div>
                  <div className="flex items-center">
                    <div
                      className="p-1 rounded-full mr-3"
                      style={{ backgroundColor: "#cf9646" }}
                    >
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <span>Customer First</span>
                  </div>
                  <div className="flex items-center">
                    <div
                      className="p-1 rounded-full mr-3"
                      style={{ backgroundColor: "#cf9646" }}
                    >
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <span>Innovation-Driven</span>
                  </div>
                  <div className="flex items-center">
                    <div
                      className="p-1 rounded-full mr-3"
                      style={{ backgroundColor: "#cf9646" }}
                    >
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <span>Sustainability</span>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section
        id="services"
        className="py-20 px-6 md:px-12 bg-black text-white"
      >
        <div className="container mx-auto">
          <AnimatedSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Our Services
              </h2>
              <div
                className="w-24 h-1 mx-auto"
                style={{ backgroundColor: "#cf9646" }}
              ></div>
              <p className="mt-6 text-gray-400 max-w-3xl mx-auto">
                We offer comprehensive interior design solutions tailored to
                your specific needs and preferences.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Modular Kitchen",
                description:
                  "Custom-designed modular kitchens that combine functionality with aesthetic appeal.",
              },
              {
                title: "Wardrobes & Storage",
                description:
                  "Innovative storage solutions that maximize space while enhancing your interior design.",
              },
              {
                title: "Living Room Furniture",
                description:
                  "Elegant and comfortable living room furniture designed to create inviting spaces.",
              },
              {
                title: "Office Furniture",
                description:
                  "Professional office furniture that promotes productivity and reflects your brand identity.",
              },
              {
                title: "Custom Furniture",
                description:
                  "Bespoke furniture pieces crafted to meet your specific requirements and preferences.",
              },
              {
                title: "Interior Consultation",
                description:
                  "Expert advice on interior design to help you create spaces that reflect your vision.",
              },
            ].map((service, index) => (
              <AnimatedSection key={index} delay={index * 0.1}>
                <div className="p-8 border border-gray-800 rounded-sm hover:border-[#cf9646] transition-colors duration-300 h-full group">
                  <div
                    className="w-16 h-16 rounded-sm flex items-center justify-center mb-6 group-hover:bg-white transition-colors duration-300"
                    style={{ backgroundColor: "#cf9646" }}
                  >
                    <span className="text-white text-2xl font-bold group-hover:text-[#cf9646]">
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-4">{service.title}</h3>
                  <p className="text-gray-400">{service.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 px-6 md:px-12">
        <div className="container mx-auto">
          <AnimatedSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Choose Sanmay Modutech?
              </h2>
              <div
                className="w-24 h-1 mx-auto"
                style={{ backgroundColor: "#cf9646" }}
              ></div>
              <p className="mt-6 text-gray-600 max-w-3xl mx-auto">
                We stand out from the competition with our commitment to
                quality, innovation, and customer satisfaction.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "First Online Platform",
                description:
                  "First online platform for modular furniture in India.",
              },
              {
                title: "Instant Quotation",
                description: "Quotation provided instantly, not days.",
              },
              {
                title: "Precision Engineering",
                description:
                  "Precision engineering with cutting-edge technology.",
              },
              {
                title: "Hassle-Free Support",
                description: "Hassle-free installation and post-sale support.",
              },
            ].map((feature, index) => (
              <AnimatedSection key={index} delay={index * 0.1}>
                <div
                  className="bg-white p-8 rounded-sm shadow-lg border-b-4 hover:translate-y-[-10px] transition-all duration-300"
                  style={{ borderBottomColor: "#cf9646" }}
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                    <span
                      className="text-2xl font-bold"
                      style={{ color: "#cf9646" }}
                    >
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-center mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-center">
                    {feature.description}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-6 md:px-12 bg-gray-50">
        <div className="container mx-auto">
          <AnimatedSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                What Our Clients Say
              </h2>
              <div
                className="w-24 h-1 mx-auto"
                style={{ backgroundColor: "#cf9646" }}
              ></div>
              <p className="mt-6 text-gray-600 max-w-3xl mx-auto">
                Don't just take our word for it. Here's what our satisfied
                clients have to say about our services.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((_, index) => (
              <AnimatedSection key={index} delay={index * 0.1}>
                <div className="bg-white p-8 rounded-sm shadow-lg relative">
                  <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 40 40"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 22H6V16H12V22ZM12 28H6V22H12V28ZM18 22H12V16H18V22ZM18 28H12V22H18V28ZM18 16H12V10H18V16ZM24 22H18V16H24V22Z"
                        fill="#cf9646"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-600 mb-6 italic">
                    "The team at Sanmay Modutech transformed our space beyond
                    our expectations. Their attention to detail and commitment
                    to quality is unmatched."
                  </p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-full mr-4">
                      <img
                        src="https://placehold.co/100x100"
                        alt="Client"
                        className="rounded-full"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold">Rajesh Sharma</h4>
                      <p className="text-sm text-gray-500">
                        Mumbai, Maharashtra
                      </p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Milestones Section */}
      <section className="py-20 px-6 md:px-12 bg-white">
        <div className="container mx-auto">
          <AnimatedSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Our Milestones
              </h2>
              <div
                className="w-24 h-1 mx-auto"
                style={{ backgroundColor: "#cf9646" }}
              ></div>
              <p className="mt-6 text-gray-600 max-w-3xl mx-auto">
                Our journey of growth and innovation in the modular furniture
                industry.
              </p>
            </div>
          </AnimatedSection>

          <div className="relative">
            {/* Timeline line */}
            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gray-200"></div>

            <div className="space-y-16 md:space-y-0">
              <div className="flex flex-col md:flex-row items-center">
                <AnimatedSection delay={0.1}>
                  <div className="md:w-1/2 md:pr-12 md:text-right mb-6 md:mb-0">
                    <h3
                      className="text-xl font-semibold"
                      style={{ color: "#cf9646" }}
                    >
                      July 2024
                    </h3>
                    <p className="text-gray-600">
                      Successful onboarding of young & talented professionals.
                    </p>
                  </div>
                </AnimatedSection>
                <div className="md:w-12 flex justify-center items-center">
                  <div
                    className="w-8 h-8 rounded-full z-10"
                    style={{ backgroundColor: "#cf9646" }}
                  ></div>
                </div>
                <div className="md:w-1/2 md:pl-12">
                  {/* Empty space for alignment */}
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center md:mt-16">
                <div className="md:w-1/2 md:pr-12 md:text-right order-2 md:order-1 hidden md:block">
                  {/* Empty space for alignment */}
                </div>
                <div className="md:w-12 flex justify-center items-center order-1 md:order-2">
                  <div
                    className="w-8 h-8 rounded-full z-10"
                    style={{ backgroundColor: "#cf9646" }}
                  ></div>
                </div>
                <AnimatedSection delay={0.2}>
                  <div className="md:w-1/2 md:pl-12 order-3">
                    <h3
                      className="text-xl font-semibold"
                      style={{ color: "#cf9646" }}
                    >
                      September 2024
                    </h3>
                    <p className="text-gray-600">Launch of Warsto.com brand.</p>
                  </div>
                </AnimatedSection>
              </div>

              <div className="flex flex-col md:flex-row items-center md:mt-16">
                <AnimatedSection delay={0.3}>
                  <div className="md:w-1/2 md:pr-12 md:text-right mb-6 md:mb-0">
                    <h3
                      className="text-xl font-semibold"
                      style={{ color: "#cf9646" }}
                    >
                      December 2024
                    </h3>
                    <p className="text-gray-600">
                      Streamlined production and delivery processes for modular
                      furniture.
                    </p>
                  </div>
                </AnimatedSection>
                <div className="md:w-12 flex justify-center items-center">
                  <div
                    className="w-8 h-8 rounded-full z-10"
                    style={{ backgroundColor: "#cf9646" }}
                  ></div>
                </div>
                <div className="md:w-1/2 md:pl-12">
                  {/* Empty space for alignment */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-6 md:px-12 bg-black text-white">
        <div className="container mx-auto">
          <AnimatedSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Get In Touch
              </h2>
              <div
                className="w-24 h-1 mx-auto"
                style={{ backgroundColor: "#cf9646" }}
              ></div>
              <p className="mt-6 text-gray-400 max-w-3xl mx-auto">
                Have a question or ready to start your project? Contact us today
                for a consultation.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-12">
            <AnimatedSection delay={0.1}>
              <div>
                <h3 className="text-xl font-semibold mb-6">
                  Contact Information
                </h3>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div
                      className="p-2 rounded-sm mr-4"
                      style={{ backgroundColor: "#cf9646" }}
                    >
                      <Phone className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium" style={{ color: "#cf9646" }}>
                        Phone
                      </h4>
                      <p className="text-gray-300">+91 9987 448 555</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div
                      className="p-2 rounded-sm mr-4"
                      style={{ backgroundColor: "#cf9646" }}
                    >
                      <Mail className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium" style={{ color: "#cf9646" }}>
                        Email
                      </h4>
                      <p className="text-gray-300">sagar@sanmaymodutech.com</p>
                      <p className="text-gray-300">
                        taashika@sanmaymodutech.com
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div
                      className="p-2 rounded-sm mr-4"
                      style={{ backgroundColor: "#cf9646" }}
                    >
                      <Globe className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium" style={{ color: "#cf9646" }}>
                        Website
                      </h4>
                      <p className="text-gray-300">www.warsto.com</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div
                      className="p-2 rounded-sm mr-4"
                      style={{ backgroundColor: "#cf9646" }}
                    >
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium" style={{ color: "#cf9646" }}>
                        Address
                      </h4>
                      <p className="text-gray-300">
                        Mumbai, Maharashtra, India
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-10">
                  <h3 className="text-xl font-semibold mb-4">
                    We're Looking for Talent
                  </h3>
                  <p className="text-gray-400">
                    Be part of a forward-thinking team at Sanmay Modutech LLP.
                    Explore opportunities to grow with us.
                  </p>
                  <a
                    href="#"
                    className="inline-flex items-center transition-colors duration-300"
                    style={{ color: "#cf9646" }}
                  >
                    View Careers
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <div className="bg-white bg-opacity-5 p-8 rounded-sm">
                <h3 className="text-xl font-semibold mb-6">
                  Send us a Message
                </h3>
                <form className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block mb-2 text-sm">
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        className="w-full px-4 py-3 bg-transparent border border-gray-700 rounded-sm focus:outline-none focus:border-[#cf9646] transition-colors duration-300 text-white"
                        placeholder="Your Name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block mb-2 text-sm">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        className="w-full px-4 py-3 bg-transparent border border-gray-700 rounded-sm focus:outline-none focus:border-[#cf9646] transition-colors duration-300 text-white"
                        placeholder="Your Email"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block mb-2 text-sm">
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      className="w-full px-4 py-3 bg-transparent border border-gray-700 rounded-sm focus:outline-none focus:border-[#cf9646] transition-colors duration-300 text-white"
                      placeholder="Subject"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block mb-2 text-sm">
                      Message
                    </label>
                    <textarea
                      id="message"
                      rows="4"
                      className="w-full px-4 py-3 bg-transparent border border-gray-700 rounded-sm focus:outline-none focus:border-[#cf9646] transition-colors duration-300 text-white"
                      placeholder="Your Message"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="px-8 py-3 bg-[#cf9646] text-white font-medium rounded-sm hover:bg-[#b88339] transition-colors duration-300 w-full md:w-auto"
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12 px-6 md:px-12 border-t border-gray-800">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-6">
                <img
                  src="/logo.png"
                  alt="Company Logo"
                  className="h-10 w-auto"
                />
                <span className="ml-3 text-xl font-bold">
                  <span className="text-white">War</span>
                  <span style={{ color: "#cf9646" }}>sto</span>
                </span>
              </div>
              <p className="text-gray-400 mb-6">
                India's first modular furniture e-commerce platform delivering
                speed, precision, and quality.
              </p>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="text-gray-400 hover:text-[#cf9646] transition-colors duration-300"
                >
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-[#cf9646] transition-colors duration-300"
                >
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-[#cf9646] transition-colors duration-300"
                >
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-[#cf9646] transition-colors duration-300"
                >
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-6">Quick Links</h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-[#cf9646] transition-colors duration-300"
                  >
                    Home
                  </a>
                </li>
                <li>
                  <a
                    href="#about"
                    className="text-gray-400 hover:text-[#cf9646] transition-colors duration-300"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="#services"
                    className="text-gray-400 hover:text-[#cf9646] transition-colors duration-300"
                  >
                    Services
                  </a>
                </li>
                <li>
                  <a
                    href="#portfolio"
                    className="text-gray-400 hover:text-[#cf9646] transition-colors duration-300"
                  >
                    Portfolio
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    className="text-gray-400 hover:text-[#cf9646] transition-colors duration-300"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-6">Services</h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-[#cf9646] transition-colors duration-300"
                  >
                    Modular Kitchen
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-[#cf9646] transition-colors duration-300"
                  >
                    Wardrobes & Storage
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-[#cf9646] transition-colors duration-300"
                  >
                    Living Room Furniture
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-[#cf9646] transition-colors duration-300"
                  >
                    Office Furniture
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-[#cf9646] transition-colors duration-300"
                  >
                    Custom Furniture
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-6">Newsletter</h3>
              <p className="text-gray-400 mb-4">
                Subscribe to our newsletter for the latest updates and offers.
              </p>
              <form className="space-y-4">
                <input
                  type="email"
                  className="w-full px-4 py-3 bg-transparent border border-gray-700 rounded-sm focus:outline-none focus:border-[#cf9646] transition-colors duration-300 text-white"
                  placeholder="Your Email"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#cf9646] text-white font-medium rounded-sm hover:bg-[#b88339] transition-colors duration-300 w-full"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400">
              © {new Date().getFullYear()} Sanmay Modutech LLP. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
