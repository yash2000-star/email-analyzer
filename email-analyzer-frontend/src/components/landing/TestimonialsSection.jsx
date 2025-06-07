import React from 'react';
import { motion } from 'framer-motion';
import styles from './TestimonialsSection.module.css';

const testimonials = [
  {
    quote: "InboXAI has genuinely given me back an hour every day. I no longer live in fear of my inbox. A must-have tool for any professional.",
    author: "Krishnanshu Rathore",
    title: "Project Manager",
  },
  {
    quote: "The privacy-first approach was a huge selling point for me. The AI summaries are brilliant, but knowing my data is safe is what matters most.",
    author: "Yash Nirwan",
    title: "Lead Developer",
  },
];

function TestimonialsSection() {
  return (
    <section className={styles.testimonials}>
      <div className={styles.container}>
        {testimonials.map((testimonial, index) => (
          <motion.div 
            key={index} 
            className={styles.card}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, delay: index * 0.2 }}
          >
            <p className={styles.quote}>"{testimonial.quote}"</p>
            <div className={styles.author}>
              <span className={styles.authorName}>{testimonial.author}</span>
              <span className={styles.authorTitle}>{testimonial.title}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default TestimonialsSection;