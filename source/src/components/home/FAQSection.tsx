"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useEffect, useState } from 'react'
import { FAQ } from '@/types/faq'
import Link from "next/link"

export default function FAQSection() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const response = await fetch('/api/faq')
        const data = await response.json()
        if (Array.isArray(data)) {
          setFaqs(data)
        } else {
          console.error('Unexpected data format:', data)
          setFaqs([])
        }
      } catch (error) {
        console.error('Error fetching FAQs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFAQs()
  }, [])

  if (loading) {
    return (
      <section className="py-16 bg-church-light">
        <div className="container-custom">
          <h2 className="section-title centered">Frequently Asked Questions</h2>
          <p className="text-center text-church-muted mb-10 max-w-2xl mx-auto">
            Loading FAQs...
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-church-light">
      <div className="container-custom">
        <h2 className="section-title centered">Frequently Asked Questions</h2>
        <p className="text-center text-church-muted mb-10 max-w-2xl mx-auto">
          Have questions about visiting or joining our church? Find answers to commonly asked questions below.
        </p>

        <div className="max-w-3xl mx-auto">
          <Accordion type="multiple" className="w-full">
            {faqs.map((faq) => (
              <AccordionItem key={faq.faq_id} value={faq.faq_id} className="border-b border-church-muted/20">
                <AccordionTrigger className="text-lg font-medium text-church-dark hover:text-church-primary transition-colors py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-church-muted">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {faqs.length === 0 && (
            <div className="text-center py-8">
              <p className="text-church-muted">No FAQs found.</p>
            </div>
          )}

          <div className="mt-10 text-center">
            <p className="text-church-muted mb-4">
              Don&apos;t see your question listed? Feel free to reach out to us directly.
            </p>
            <Link
              href="/contact"
              className="text-church-primary font-medium hover:text-church-primary/80 transition-colors"
            >
              Contact us for more information &rarr;
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}