"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    question: "What time are your Sunday services?",
    answer: "We have two Sunday worship services at 9:00 AM and 11:00 AM. Both services feature the same sermon content but may have slight variations in music and worship style."
  },
  {
    question: "Is there a program for children during services?",
    answer: "Yes! We have a vibrant Children's Ministry for kids ages 0-12 that runs concurrent with our Sunday services. Children are checked in before service and enjoy age-appropriate Bible teaching, worship, and activities."
  },
  {
    question: "How can I become a member of the church?",
    answer: "We offer membership classes quarterly that cover our church's beliefs, values, and vision. After completing the class, you'll meet with a pastor for a brief conversation about your faith journey, and then be welcomed as a member during a Sunday service."
  },
  {
    question: "Do I need to dress formally for church services?",
    answer: "Not at all! We welcome you to come as you are. Our congregation dresses in a range of styles from casual to business casual. We care more about your presence than your appearance."
  }
]

export default function FAQSection() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container-custom">
        <h2 className="section-title centered">Frequently Asked Questions</h2>
        <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">
          Have questions about visiting or joining our church? Find answers to commonly asked questions below.
        </p>
        
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-b border-gray-200">
                <AccordionTrigger className="text-lg font-medium text-gray-900 hover:text-church-primary transition-colors py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          
          <div className="mt-10 text-center">
            <p className="text-gray-600 mb-4">
              Don't see your question listed? Feel free to reach out to us directly.
            </p>
            <a 
              href="/contact" 
              className="text-church-primary font-medium hover:text-church-primary/80 transition-colors"
            >
              Contact us for more information &rarr;
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}