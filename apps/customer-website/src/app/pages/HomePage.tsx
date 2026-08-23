import { Link } from "react-router";
import { MapPin, Clock, Wifi, QrCode, Calendar } from "lucide-react";

export function HomePage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-teal-50 to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-6">
                Find and Reserve Your Perfect Workspace
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Experience premium co-working and study spaces with real-time availability,
                easy online booking, and flexible memberships tailored to your needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/workspaces"
                  className="px-8 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-center"
                >
                  Reserve a Workspace
                </Link>
                <Link
                  to="/workspaces"
                  className="px-8 py-3 border-2 border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition-colors text-center"
                >
                  View Workspace Map
                </Link>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3dvcmtpbmclMjBzcGFjZSUyMG1vZGVybnxlbnwxfHx8fDE3Nzg4NTMzNzR8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Modern coworking space"
                className="rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Overview Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-4">Why Choose DeskAtlas?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need for productive and flexible workspace solutions
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Real-Time Visibility</h3>
              <p className="text-gray-600 text-sm">
                See available workspaces instantly with our live interactive map
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Online Reservation</h3>
              <p className="text-gray-600 text-sm">
                Book your preferred workspace in seconds with our seamless booking system
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <QrCode className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">QR-Based Access</h3>
              <p className="text-gray-600 text-sm">
                Contactless check-in with your unique QR code reservation
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Easy Space Selection</h3>
              <p className="text-gray-600 text-sm">
                Choose your exact desk or room from our interactive floor map
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Workspace Preview Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-4">Our Workspace Types</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              From focused individual desks to collaborative meeting rooms
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
              <img
                src="https://images.unsplash.com/photo-1562664348-2188b99b5157?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw3fHxjb3dvcmtpbmclMjBzcGFjZSUyMG1vZGVybnxlbnwxfHx8fDE3Nzg4NTMzNzR8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Open Desk"
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Open Desk</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Shared workspace with high-speed WiFi and power outlets
                </p>
                <p className="text-teal-600 font-semibold">$15/day</p>
              </div>
            </div>
            <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
              <img
                src="https://images.unsplash.com/photo-1604328698692-f76ea9498e76?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw4fHxjb3dvcmtpbmclMjBzcGFjZSUyMG1vZGVybnxlbnwxfHx8fDE3Nzg4NTMzNzR8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Private Desk"
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Private Desk</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Dedicated workspace with lockable storage and monitor
                </p>
                <p className="text-teal-600 font-semibold">$35/day</p>
              </div>
            </div>
            <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
              <img
                src="https://images.unsplash.com/photo-1600508774634-4e11d34730e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxjb3dvcmtpbmclMjBzcGFjZSUyMG1vZGVybnxlbnwxfHx8fDE3Nzg4NTMzNzR8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Meeting Room"
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Meeting Room</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Private room for 4-8 people with AV equipment
                </p>
                <p className="text-teal-600 font-semibold">$60/hour</p>
              </div>
            </div>
            <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
              <img
                src="https://images.unsplash.com/photo-1626187777040-ffb7cb2c5450?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxMHx8Y293b3JraW5nJTIwc3BhY2UlMjBtb2Rlcm58ZW58MXx8fHwxNzc4ODUzMzc0fDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Study Area"
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Study Area</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Quiet zone perfect for focused study sessions
                </p>
                <p className="text-teal-600 font-semibold">$12/day</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-4">Visit Us</h2>
            <p className="text-gray-600">Conveniently located in the heart of the city</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="bg-gray-100 rounded-xl h-96 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Interactive Map Placeholder</p>
                <p className="text-sm text-gray-500 mt-2">Google Maps integration available</p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Address</h3>
                <p className="text-gray-600">123 Innovation Street</p>
                <p className="text-gray-600">Tech City, TC 12345</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Operating Hours</h3>
                <div className="space-y-1 text-gray-600">
                  <p>Monday - Friday: 7:00 AM - 10:00 PM</p>
                  <p>Saturday: 8:00 AM - 8:00 PM</p>
                  <p>Sunday: 9:00 AM - 6:00 PM</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Contact</h3>
                <p className="text-gray-600">Phone: (555) 123-4567</p>
                <p className="text-gray-600">Email: info@workspacehub.com</p>
              </div>
              <button className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
                Get Directions
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
