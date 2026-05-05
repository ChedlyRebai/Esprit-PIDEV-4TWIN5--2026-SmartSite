import { useState, useRef, useEffect, useCallback } from "react";
import {
  Shield,
  Upload,
  AlertTriangle,
  CheckCircle,
  Loader2,
  X,
  Camera,
  CameraOff,
  Play,
  Square,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { incidentEvents } from "./IncidentBadge";

const CCTV_API = import.meta.env.VITE_CCTV_API_URL || "http://localhost:8002";

interface Detection {
  class: string;
  confidence: number;
  bbox: { x1: number; y1: number; x2: number; y2: number };
  is_violation: boolean;
}

interface DetectionResult {
  success: boolean;
  summary: {
    total_detections: number;
    helmet_count: number;
    no_helmet_count: number;
    has_violations: boolean;
    alert_sent: boolean;
  };
  detections: Detection[];
  annotated_image: string;
}

// ─── Mode Image ───────────────────────────────────────────────────────────────
function ImageMode() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const detectHelmet = async (file: File) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("confidence", "0.5");
      formData.append("send_alert", "true");

      const response = await fetch(`${CCTV_API}/detect/image`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error(`Service error: ${response.status}`);

      const data: DetectionResult = await response.json();
      setResult(data);

      if (data.summary.has_violations) {
        toast.error(
          `🚨 ${data.summary.no_helmet_count} worker(s) without helmet!`,
          { duration: 6000 }
        );
        if (data.summary.alert_sent) {
          toast.warning("⚠️ Incident automatically created in SmartSite", {
            duration: 4000,
          });
          // Notifier la page Incidents pour recharger la liste
          incidentEvents.emit("created", { source: "ai-helmet-detection" });
        }
      } else if (data.summary.helmet_count > 0) {
        toast.success("✅ All detected workers are wearing helmets");
      } else {
        toast.info("No persons detected in this image");
      }
    } catch {
      toast.error("Detection service unavailable. Make sure it is running on port 8002.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <div
        className="border-2 border-dashed border-orange-300 rounded-xl p-6 text-center cursor-pointer hover:bg-orange-50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setResult(null);
              detectHelmet(file);
            }
          }}
        />
        {isLoading ? (
          <div className="flex flex-col items-center gap-2 text-orange-600">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-sm font-medium">Analyzing image...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-orange-500">
            <Upload className="h-8 w-8" />
            <span className="text-sm font-medium">Click to upload a site photo</span>
            <span className="text-xs text-muted-foreground">JPG, PNG supported</span>
          </div>
        )}
      </div>

      {/* Résultat image */}
      {result && (
        <div className="space-y-3">
          <div
            className={`rounded-xl p-4 flex items-center gap-3 ${
              result.summary.has_violations
                ? "bg-red-50 border border-red-200"
                : "bg-green-50 border border-green-200"
            }`}
          >
            {result.summary.has_violations ? (
              <AlertTriangle className="h-6 w-6 text-red-500 shrink-0" />
            ) : (
              <CheckCircle className="h-6 w-6 text-green-500 shrink-0" />
            )}
            <div className="flex-1">
              <p className={`font-semibold text-sm ${result.summary.has_violations ? "text-red-700" : "text-green-700"}`}>
                {result.summary.has_violations
                  ? `${result.summary.no_helmet_count} violation(s) detected`
                  : "No violations — all workers compliant"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                ✅ {result.summary.helmet_count} with helmet · 🚨 {result.summary.no_helmet_count} without · {result.summary.total_detections} total
              </p>
              {result.summary.alert_sent && (
                <p className="text-xs text-orange-600 font-medium mt-1">
                  ⚠️ Incident automatically created in SmartSite
                </p>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={() => setResult(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {result.annotated_image && (
            <div className="rounded-xl overflow-hidden border border-slate-200">
              <img
                src={result.annotated_image}
                alt="Detection result"
                className="w-full object-contain max-h-80"
              />
            </div>
          )}

          {result.detections.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {result.detections.map((d, i) => (
                <Badge
                  key={i}
                  variant={d.is_violation ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  {d.class} {(d.confidence * 100).toFixed(0)}%
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Mode Webcam (même logique que ton Streamlit) ─────────────────────────────
function WebcamMode() {
  const videoRef        = useRef<HTMLVideoElement>(null);
  const canvasRef       = useRef<HTMLCanvasElement>(null);
  const streamRef       = useRef<MediaStream | null>(null);
  const intervalRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastAlertRef    = useRef<number>(0); // timestamp dernière alerte (cooldown 10s)

  const [isRunning, setIsRunning]           = useState(false);
  const [isLoading, setIsLoading]           = useState(false);
  const [annotatedFrame, setAnnotatedFrame] = useState<string | null>(null);
  const [liveStats, setLiveStats]           = useState({
    people_detected: 0,
    no_helmet: 0,
    helmet: 0,
  });

  // Capture une frame et l'envoie à FastAPI — même logique que ton while True Python
  const detectFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video  = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    // Convertir la frame en blob (comme cv2.VideoCapture dans Python)
    canvas.toBlob(async (blob) => {
      if (!blob) return;

      try {
        const formData = new FormData();
        formData.append("file", blob, "frame.jpg");
        formData.append("confidence", "0.5");
        // send_alert géré manuellement avec cooldown comme ton Python
        formData.append("send_alert", "false");

        const response = await fetch(`${CCTV_API}/detect/image`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) return;

        const data: DetectionResult = await response.json();

        // Mettre à jour l'image annotée (comme frame_placeholder.image dans Streamlit)
        setAnnotatedFrame(data.annotated_image);

        // Mettre à jour les stats (comme status_placeholder.info dans Streamlit)
        setLiveStats({
          people_detected: data.summary.total_detections,
          no_helmet:       data.summary.no_helmet_count,
          helmet:          data.summary.helmet_count,
        });

        // Cooldown 10 secondes — même logique que ton Python :
        // if (now - last).seconds > 10: send_incident()
        if (data.summary.has_violations) {
          const now = Date.now();
          if (now - lastAlertRef.current > 10000) {
            lastAlertRef.current = now;

            // Envoyer l'alerte manuellement
            const alertFormData = new FormData();
            alertFormData.append("file", blob, "frame.jpg");
            alertFormData.append("confidence", "0.5");
            alertFormData.append("send_alert", "true");
            await fetch(`${CCTV_API}/detect/image`, {
              method: "POST",
              body: alertFormData,
            });

            toast.error(
              `🚨 ${data.summary.no_helmet_count} worker(s) without helmet!`,
              { duration: 5000 }
            );
            // Notifier la page Incidents pour recharger la liste
            incidentEvents.emit("created", { source: "ai-helmet-detection-webcam" });
          }
        }
      } catch {
        // Service indisponible — on continue sans bloquer
      }
    }, "image/jpeg", 0.8);
  }, []);

  // Démarrer la webcam — comme cap = cv2.VideoCapture(0)
  const startCamera = async () => {
    setIsLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Lancer la détection toutes les 500ms — comme ton while True Python
      intervalRef.current = setInterval(detectFrame, 500);
      setIsRunning(true);
      toast.success("🎥 Camera started — live detection active");
    } catch {
      toast.error("❌ Cannot access webcam. Check camera permissions.");
    } finally {
      setIsLoading(false);
    }
  };

  // Arrêter la webcam — comme cap.release() dans Python
  const stopCamera = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsRunning(false);
    setAnnotatedFrame(null);
    setLiveStats({ people_detected: 0, no_helmet: 0, helmet: 0 });
    toast.info("⏹️ Camera stopped");
  };

  // Cleanup au démontage du composant
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Boutons Start / Stop — comme tes boutons Streamlit */}
      <div className="flex gap-3">
        {!isRunning ? (
          <Button
            onClick={startCamera}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Start Camera
          </Button>
        ) : (
          <Button
            onClick={stopCamera}
            variant="destructive"
          >
            <Square className="h-4 w-4 mr-2" />
            Stop Camera
          </Button>
        )}
      </div>

      {/* Stats live — comme status_placeholder.info dans Streamlit */}
      {isRunning && (
        <div
          className={`rounded-xl p-3 flex items-center gap-4 text-sm font-medium border ${
            liveStats.no_helmet > 0
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-green-50 border-green-200 text-green-700"
          }`}
        >
          <span>👥 People detected: <strong>{liveStats.people_detected}</strong></span>
          <span>✅ With helmet: <strong>{liveStats.helmet}</strong></span>
          <span>🚨 No helmet: <strong>{liveStats.no_helmet}</strong></span>
          {liveStats.no_helmet > 0 && (
            <Badge variant="destructive" className="ml-auto animate-pulse">
              VIOLATION DETECTED
            </Badge>
          )}
        </div>
      )}

      {/* Flux vidéo annoté — comme frame_placeholder.image dans Streamlit */}
      <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-black min-h-[300px] flex items-center justify-center">
        {/* Vidéo brute (cachée, utilisée pour capturer les frames) */}
        <video
          ref={videoRef}
          className="hidden"
          muted
          playsInline
        />
        {/* Canvas caché pour capturer les frames */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Affichage : image annotée par YOLO ou placeholder */}
        {annotatedFrame ? (
          <img
            src={annotatedFrame}
            alt="Live detection"
            className="w-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            {isRunning ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-sm">Waiting for first detection...</span>
              </>
            ) : (
              <>
                <CameraOff className="h-8 w-8" />
                <span className="text-sm">Camera not started</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export function HelmetDetection() {
  const [mode, setMode] = useState<"image" | "webcam">("image");

  return (
    <Card className="border-2 border-orange-200 bg-orange-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-700">
          <Shield className="h-5 w-5" />
          AI Helmet Detection
          <Badge variant="outline" className="ml-auto text-xs border-orange-300 text-orange-600">
            YOLOv8
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Detect PPE violations on construction site photos or live camera feed
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Sélecteur de mode — comme ton st.radio("Mode", ["📷 Image", "🎥 Webcam"]) */}
        <div className="flex gap-2">
          <Button
            variant={mode === "image" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("image")}
            className={mode === "image" ? "bg-orange-600 hover:bg-orange-700" : ""}
          >
            <Upload className="h-4 w-4 mr-2" />
            📷 Image
          </Button>
          <Button
            variant={mode === "webcam" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("webcam")}
            className={mode === "webcam" ? "bg-orange-600 hover:bg-orange-700" : ""}
          >
            <Camera className="h-4 w-4 mr-2" />
            🎥 Webcam
          </Button>
        </div>

        {/* Contenu selon le mode */}
        {mode === "image" ? <ImageMode /> : <WebcamMode />}
      </CardContent>
    </Card>
  );
}
