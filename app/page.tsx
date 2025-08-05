'use client';

import AuthGuard from '@/components/auth-guard';

export default function Home() {

  return (
    <AuthGuard>
      <div className="py-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              AI-Powered Appointment Scheduling
            </h1>
            <p className="text-gray-600 mb-4">
              Book, cancel, or reschedule your pharmacy appointments with our voice assistant
            </p>
          </div>
          
          {/* Voice Interface Only */}
          {/* <div className="mb-8 max-w-2xl mx-auto">
            <RetellSimpleClient 
              agentId="agent_fa18dcd11913e3ccde2931ddfc"
              publicKey="public_key_73c641de4f51ee6bdc6a9"
              onCallStart={() => console.log('Voice call started')}
              onCallEnd={() => console.log('Voice call ended')}
            />
          </div> */}
          
          <div className="mt-8 text-center">
            <div className="bg-white rounded-lg p-6 shadow-md max-w-2xl mx-auto">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Available Services
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="font-medium text-blue-900">Flu Shots</div>
                  <div className="text-blue-700">Seasonal vaccinations</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="font-medium text-green-900">Consultations</div>
                  <div className="text-green-700">Health discussions</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="font-medium text-purple-900">Med Reviews</div>
                  <div className="text-purple-700">Medication check-ups</div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="font-medium text-orange-900">Vaccinations</div>
                  <div className="text-orange-700">Various immunizations</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
