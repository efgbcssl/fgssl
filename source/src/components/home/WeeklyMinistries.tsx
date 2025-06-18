"use client"

import { Calendar, Clock, MapPin } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const ministryItems = [
  {
    id: 1,
    title: "Sunday Worship Service",
    day: "Sunday",
    time: "9:00 AM & 11:00 AM",
    location: "Main Sanctuary",
    description: "Join us for worship, prayer, and an inspiring message from our pastor.",
    category: "worship"
  },
  {
    id: 2,
    title: "Wednesday Bible Study",
    day: "Wednesday",
    time: "7:00 PM",
    location: "Fellowship Hall",
    description: "A deeper study of scripture in a smaller group setting.",
    category: "study"
  },
  {
    id: 3,
    title: "Youth Group",
    day: "Friday",
    time: "6:30 PM",
    location: "Youth Center",
    description: "For teens to connect, have fun, and grow in their faith.",
    category: "youth"
  },
  {
    id: 4,
    title: "Children's Church",
    day: "Sunday",
    time: "9:00 AM & 11:00 AM",
    location: "Children's Wing",
    description: "Age-appropriate worship and Bible lessons for children.",
    category: "children"
  },
  {
    id: 5,
    title: "Prayer Meeting",
    day: "Tuesday",
    time: "6:00 AM",
    location: "Prayer Room",
    description: "Early morning prayer gathering to lift up community needs.",
    category: "prayer"
  },
  {
    id: 6,
    title: "Young Adults Fellowship",
    day: "Thursday",
    time: "7:30 PM",
    location: "Multipurpose Room",
    description: "For young adults to connect and grow in their faith journey.",
    category: "fellowship"
  },
]

const categoryColors: Record<string, string> = {
  worship: "bg-blue-100 text-blue-800",
  study: "bg-purple-100 text-purple-800",
  youth: "bg-green-100 text-green-800",
  children: "bg-pink-100 text-pink-800",
  prayer: "bg-yellow-100 text-yellow-800",
  fellowship: "bg-indigo-100 text-indigo-800",
}

export default function WeeklyMinistries() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container-custom">
        <h2 className="section-title centered">Weekly Ministries</h2>
        <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">
          Join us for our regular weekly ministries and grow in your faith journey.
          Everyone is welcome to participate in these gatherings.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ministryItems.map((item) => (
            <Card key={item.id} className="card-hover">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl font-heading">{item.title}</CardTitle>
                  <Badge className={categoryColors[item.category] || "bg-gray-100 text-gray-800"}>
                    {item.category}
                  </Badge>
                </div>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-church-primary" />
                    <span>{item.day}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-church-primary" />
                    <span>{item.time}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-church-primary" />
                    <span>{item.location}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                {/*<button className="text-church-primary font-medium hover:text-church-primary/80 transition-colors">
                  Learn more &rarr;
                </button>*/}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}