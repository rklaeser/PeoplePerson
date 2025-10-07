import React, { useEffect } from 'react'
import { auth } from '@/config/firebase'
import * as firebaseui from 'firebaseui'
import 'firebaseui/dist/firebaseui.css'
import { EmailAuthProvider } from 'firebase/auth'

const FirebaseAuth: React.FC = () => {
  useEffect(() => {
    // Initialize the FirebaseUI Widget using Firebase.
    const ui = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(auth)

    const uiConfig = {
      signInSuccessUrl: '/',
      signInOptions: [
        EmailAuthProvider.PROVIDER_ID,
      ],
      // Terms of service url/callback.
      tosUrl: '/terms',
      // Privacy policy url/callback.
      privacyPolicyUrl: '/privacy',
      callbacks: {
        signInSuccessWithAuthResult: () => {
          // Return false to avoid redirect
          return false
        }
      }
    }

    ui.start('#firebaseui-auth-container', uiConfig)

    return () => {
      ui.reset()
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title justify-center mb-4">Welcome to PeoplePerson</h2>
          <div id="firebaseui-auth-container"></div>
        </div>
      </div>
    </div>
  )
}

export default FirebaseAuth