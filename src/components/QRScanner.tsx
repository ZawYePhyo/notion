import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface QRScannerProps {
  onScan: (data: string) => void
  onError?: (error: string) => void
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const [scanning, setScanning] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const elementId = 'qr-reader'

  const startScanning = async () => {
    try {
      const scanner = new Html5Qrcode(elementId)
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          onScan(decodedText)
          stopScanning()
        },
        (errorMessage) => {
          // Ignore frame processing errors
          if (!errorMessage.includes('No MultiFormat Readers')) {
            console.log('QR scan error:', errorMessage)
          }
        }
      )

      setScanning(true)
    } catch (error) {
      console.error('Failed to start scanner:', error)
      if (onError) {
        onError('Failed to start camera')
      }
    }
  }

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
        scannerRef.current = null
        setScanning(false)
      } catch (error) {
        console.error('Failed to stop scanner:', error)
      }
    }
  }

  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  return (
    <div>
      <div
        id={elementId}
        style={{
          width: '100%',
          maxWidth: '500px',
          margin: '0 auto',
          borderRadius: '0.5rem',
          overflow: 'hidden'
        }}
      />

      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        {!scanning ? (
          <button
            onClick={startScanning}
            className="btn btn-primary"
          >
            Start Scanning
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="btn btn-secondary"
          >
            Stop Scanning
          </button>
        )}
      </div>
    </div>
  )
}
