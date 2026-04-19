"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { toast } from "sonner";
import { MapPin, Package, Truck, Clock, Navigation, AlertTriangle, CheckCircle, Star } from "lucide-react";
import orderService, { CreateOrderData } from "../../../services/orderService";
import { siteService, fournisseurService, Site, Fournisseur } from "../../../services/siteFournisseurService";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const truckIcon = L.icon({
  iconUrl: "/truck.png",
  iconSize: [50, 50],
  iconAnchor: [25, 25],
});

const supplierIcon = L.icon({
  iconUrl: "/warehouse.png",
  iconSize: [45, 45],
  iconAnchor: [22, 45],
});

const siteIcon = L.icon({
  iconUrl: "/construction-site.png",
  iconSize: [45, 45],
  iconAnchor: [22, 45],
});

const TUNISIA_CENTER: LatLngExpression = [33.8869, 9.5375];

function MapUpdater({ center, zoom }: { center: LatLngExpression; zoom: number }) {
  const map = useRef<any>(null);
  useEffect(() => {
    if (map.current) {
      map.current.setView(center, zoom);
    }
  }, [center, zoom]);
  return null;
}

interface CreateOrderDialogProps {
  open: boolean;
  onClose: () => void;
  materialId: string;
  materialName: string;
  materialCode: string;
  materialCategory?: string;
  materialSiteId?: string;
  materialSiteName?: string;
  materialSiteCoordinates?: { lat: number; lng: number };
  onOrderCreated: () => void;
}

interface SupplierWithDistance extends Fournisseur {
  distance: number;
  estimatedTime: number;
  hasCoordinates: boolean;
}

export default function CreateOrderDialog({
  open,
  onClose,
  materialId,
  materialName,
  materialCode,
  materialCategory,
  materialSiteId,
  materialSiteName,
  materialSiteCoordinates,
  onOrderCreated,
}: CreateOrderDialogProps) {
  const [sites, setSites] = useState<Site[]>([]);
  const [currentSite, setCurrentSite] = useState<Site | null>(null);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [recommendedSuppliers, setRecommendedSuppliers] = useState<SupplierWithDistance[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Fournisseur | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState<'pending' | 'in_transit' | 'arrived'>('pending');
  const [truckPosition, setTruckPosition] = useState<{lat: number, lng: number} | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number>(0);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const deliveryTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('📌 CreateOrderDialog opened with:', { 
      materialId, materialName, materialSiteId, materialSiteName, materialSiteCoordinates 
    });
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoadingData(true);
    setFournisseurs([]);
    setRecommendedSuppliers([]);
    setSelectedSupplier(null);
    setDeliveryStatus('pending');
    setTruckPosition(null);
    setRemainingTime(0);
    setTrackingOrderId(null);
    if (deliveryTimerRef.current) {
      clearInterval(deliveryTimerRef.current);
      deliveryTimerRef.current = null;
    }
    
    try {
      console.log("=== Starting load ===");
      console.log("Material info:", { id: materialId, name: materialName, siteId: materialSiteId, siteName: materialSiteName, coords: materialSiteCoordinates });
      
      // Load all sites first
      console.log("Loading sites...");
      const sitesData = await siteService.getSites();
      console.log("Sites loaded:", sitesData.length, sitesData.map(s => ({ id: s._id, nom: s.nom, coords: s.coordinates })));
      setSites(sitesData);
      
      // Try to find the site that matches this material's siteId
      let foundSite: Site | null = null;
      
      if (materialSiteId) {
        // First try to find in loaded sites
        foundSite = sitesData.find(s => s._id === materialSiteId || s._id === String(materialSiteId)) || null;
        
        // If not found in list, try to fetch by ID directly
        if (!foundSite) {
          console.log("Site not in list, trying to fetch by ID:", materialSiteId);
          try {
            const siteById = await siteService.getSiteById(materialSiteId);
            if (siteById) {
              foundSite = siteById;
              console.log("Found site by ID:", foundSite);
            }
          } catch (e) {
            console.log("Could not fetch site by ID:", e);
          }
        }
      }
      
      if (foundSite && foundSite.coordinates) {
        console.log("✅ Using site from database:", foundSite.nom, foundSite.coordinates);
        setCurrentSite(foundSite);
      } else if (materialSiteId && materialSiteCoordinates) {
        // Fallback to props if we have coordinates
        setCurrentSite({
          _id: materialSiteId,
          nom: materialSiteName || 'Chantier',
          adresse: '',
          coordinates: materialSiteCoordinates,
          budget: 0,
          status: '',
          isActif: true
        });
      } else if (sitesData.length > 0) {
        // Default to first site with coordinates
        const siteWithCoords = sitesData.find(s => s.coordinates);
        if (siteWithCoords) {
          setCurrentSite(siteWithCoords);
        } else {
          setCurrentSite(sitesData[0]);
        }
      }
      
      // Get all suppliers
      console.log("Loading fournisseurs...");
      const suppliersData = await fournisseurService.getFournisseurs();
      console.log("Fournisseurs loaded:", suppliersData.length);
      console.log("Fournisseurs details:", suppliersData.map(f => ({ 
        id: f._id, 
        nom: f.nom, 
        hasCoords: !!f.coordinates, 
        coords: f.coordinates 
      })));
      setFournisseurs(suppliersData);

      if (suppliersData.length === 0) {
        toast.warning('Aucun fournisseur trouvé. Veuillez ajouter des fournisseurs.');
      }

    } catch (error: any) {
      console.error("Error loading data:", error);
      console.error("Error response:", error.response?.data);
      toast.error("Erreur: " + (error.message || ""));
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    console.log("=== Effect triggered ===", { 
      site: currentSite?.nom, 
      hasCoords: !!currentSite?.coordinates,
      fournisseursCount: fournisseurs.length 
    });
    
    if (fournisseurs.length > 0) {
      calculateNearestSuppliers();
    }
  }, [currentSite, fournisseurs]);

  // New function to select site
  const handleSiteChange = (siteId: string) => {
    const site = sites.find(s => s._id === siteId);
    if (site) {
      setCurrentSite(site);
    }
  };

  const calculateNearestSuppliers = () => {
    // Always show ALL suppliers, even without coordinates
    const allSuppliers = fournisseurs.map((fournisseur) => {
      let distance = -1;
      let hasCoords = false;
      
      if (currentSite?.coordinates && fournisseur.coordinates?.lat && fournisseur.coordinates?.lng) {
        hasCoords = true;
        distance = calculateHaversineDistance(
          currentSite.coordinates.lat,
          currentSite.coordinates.lng,
          fournisseur.coordinates.lat,
          fournisseur.coordinates.lng
        );
      }
      
      return {
        ...fournisseur,
        distance,
        estimatedTime: hasCoords ? Math.round(distance * 2) : -1,
        hasCoordinates: hasCoords
      };
    });

    // Sort: suppliers with coordinates first, then by distance
    allSuppliers.sort((a, b) => {
      if (a.hasCoordinates && b.hasCoordinates) return a.distance - b.distance;
      if (a.hasCoordinates && !b.hasCoordinates) return -1;
      if (!a.hasCoordinates && b.hasCoordinates) return 1;
      return a.nom.localeCompare(b.nom);
    });

    console.log("All suppliers sorted:", allSuppliers);
    setRecommendedSuppliers(allSuppliers);
  };

  const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const formatDistance = (km: number): string => {
    if (km >= 9999) return "N/A";
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
  };

  const startDeliverySimulation = async (supplier: Fournisseur, site: Site, orderId?: string) => {
    // Update order status to in_transit if we have an orderId
    if (orderId) {
      try {
        await orderService.updateOrderStatus(orderId, { status: 'in_transit' });
        console.log('📦 Order status updated to in_transit');
      } catch (error) {
        console.error('Failed to update order status:', error);
      }
    }

    if (!supplier.coordinates || !site.coordinates) {
      toast.error("Coordonnées manquantes pour le suivi!");
      return;
    }

    // Truck goes from SITE to SUPPLIER (to pick up materials)
    const startLat = site.coordinates.lat;
    const startLng = site.coordinates.lng;
    const endLat = supplier.coordinates.lat;
    const endLng = supplier.coordinates.lng;

    const supplierWithDist = recommendedSuppliers.find(f => f._id === supplier._id);
    const duration = supplierWithDist?.estimatedTime || 60;
    const distance = supplierWithDist?.distance || 0;

    setEstimatedTime(duration);
    setRemainingTime(duration);
    setDeliveryStatus('in_transit');
    setTruckPosition({ lat: startLat, lng: startLng });

    const steps = 20;
    const intervalMs = (duration * 60 * 1000) / steps;
    let step = 0;

    if (deliveryTimerRef.current) {
      clearInterval(deliveryTimerRef.current);
    }

    deliveryTimerRef.current = setInterval(async () => {
      step++;
      const progress = step / steps;
      const newLat = startLat + (endLat - startLat) * progress;
      const newLng = startLng + (endLng - startLng) * progress;
      setTruckPosition({ lat: newLat, lng: newLng });
      setRemainingTime(Math.round(duration * (1 - progress)));

      // Update order progress in backend
      if (orderId && step % 5 === 0) {
        try {
          await orderService.updateOrderProgress(orderId, { lat: newLat, lng: newLng, progress: Math.round(progress * 100) });
        } catch (e) {
          // Ignore progress update errors
        }
      }

      if (step >= steps) {
        if (deliveryTimerRef.current) {
          clearInterval(deliveryTimerRef.current);
          deliveryTimerRef.current = null;
        }
        setDeliveryStatus('arrived');
        setTruckPosition({ lat: endLat, lng: endLng });
        setRemainingTime(0);
        
        // Update order as delivered
        if (orderId) {
          try {
            await orderService.updateOrderStatus(orderId, { status: 'delivered' });
          } catch (e) {
            // Ignore errors
          }
        }
        
        // Show notification
        const notificationMessage = `🚚 Le truck est arrivé chez ${supplier.nom}!`;
        toast.success(notificationMessage);
        
        // Browser notification
        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification('Camion Arrivé', {
              body: notificationMessage,
              icon: '/truck.png'
            });
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
              if (permission === 'granted') {
                new Notification('Camion Arrivé', {
                  body: notificationMessage,
                  icon: '/truck.png'
                });
              }
            });
          }
        }
      }
    }, intervalMs);
  };

  useEffect(() => {
    return () => {
      if (deliveryTimerRef.current) {
        clearInterval(deliveryTimerRef.current);
      }
    };
  }, []);

  const handleCreateOrder = async () => {
    console.log('=== handleCreateOrder called ===');
    console.log('currentSite:', currentSite);
    console.log('selectedSupplier:', selectedSupplier);
    
    if (!currentSite || !selectedSupplier) {
      console.error('Missing site or supplier!');
      toast.error("Veuillez sélectionner un fournisseur");
      return;
    }

    setLoading(true);
    try {
      const orderData: CreateOrderData = {
        materialId,
        quantity,
        destinationSiteId: currentSite._id,
        supplierId: selectedSupplier._id,
        estimatedDurationMinutes: recommendedSuppliers.find(f => f._id === selectedSupplier._id)?.estimatedTime || 60,
      };

      console.log('📤 Sending order data:', orderData);
      
      const createdOrder = await orderService.createOrder(orderData);
      console.log('✅ Order created, response:', createdOrder);
      toast.success("Commande créée avec succès!");
      
      // Show map and start tracking - but wait for user to start delivery
      setTrackingOrderId(createdOrder._id);
      setDeliveryStatus('pending');
      console.log('📍 State updated - trackingOrderId:', createdOrder._id, 'deliveryStatus: pending');
      onOrderCreated();
      toast.info("Cliquez sur 'Démarrer livraison' pour suivre le truck sur la carte");
    } catch (error: any) {
      console.error("Erreur création commande:", error);
      console.error("Error details:", error.response?.data);
      toast.error(error.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Commander: {materialName}
          </DialogTitle>
          <DialogDescription>
            Code: {materialCode} {materialCategory && ` | Catégorie: ${materialCategory}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loadingData ? (
            <div className="text-center py-8">Chargement...</div>
          ) : (
            <>
              {/* Site display - auto selected */}
              {currentSite ? (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">Chantier: {currentSite.nom}</span>
                  </div>
                  {currentSite.adresse && (
                    <div className="text-sm text-blue-700 mt-1">{currentSite.adresse}</div>
                  )}
                  {currentSite?.coordinates ? (
                    <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      GPS: {currentSite.coordinates.lat.toFixed(4)}, {currentSite.coordinates.lng.toFixed(4)}
                    </div>
                  ) : (
                    <div className="text-xs text-orange-500 mt-1">
                      ⚠️ Ce site n'a pas de coordonnées GPS
                    </div>
                  )}
                </div>
              ) : sites.length > 0 ? (
                <div className="p-4 bg-orange-50 rounded-lg text-center text-orange-700">
                  <AlertTriangle className="h-4 w-4 inline mr-2" />
                  Le matériau n'a pas de site assigné. Veuillez créer un chantier d'abord.
                </div>
              ) : (
                <div className="p-4 bg-orange-50 rounded-lg text-center text-orange-700">
                  <AlertTriangle className="h-4 w-4 inline mr-2" />
                  Aucun chantier trouvé. Veuillez créer un chantier d'abord.
                </div>
              )}

              {/* Quantity */}
              <div className="space-y-2">
                <Label>Quantité à commander</Label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-32"
                />
              </div>

              {/* Suppliers List */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Navigation className="h-4 w-4" />
                  Fournisseurs disponibles (triés par proximité)
                </Label>
                <p className="text-xs text-gray-500">
                  Le système recommande le fournisseur le plus proche du chantier
                </p>

                {fournisseurs.length === 0 ? (
                  <div className="p-4 bg-yellow-50 rounded-lg text-center text-yellow-700">
                    <AlertTriangle className="h-4 w-4 inline mr-2" />
                    Aucun fournisseur dans la base de données
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {recommendedSuppliers.map((fournisseur, index) => (
                      <Card
                        key={fournisseur._id}
                        className={`cursor-pointer transition-all ${
                          selectedSupplier?._id === fournisseur._id 
                            ? "border-blue-500 bg-blue-50" 
                            : "hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedSupplier(fournisseur)}
                      >
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{fournisseur.nom}</span>
                                {index === 0 && fournisseur.hasCoordinates && (
                                  <Badge className="bg-green-500 text-white text-xs">
                                    <Star className="h-3 w-3 mr-1" />
                                    Plus proche
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                {fournisseur.adresse}, {fournisseur.ville}
                              </div>
                              {fournisseur.categories && fournisseur.categories.length > 0 && (
                                <div className="mt-1">
                                  {fournisseur.categories.slice(0, 3).map((cat) => (
                                    <Badge key={cat} variant="outline" className="mr-1 text-xs">
                                      {cat}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="text-right min-w-[80px]">
                              {fournisseur.hasCoordinates ? (
                                <div>
                                  <div className="text-blue-600 font-semibold text-sm">
                                    {formatDistance(fournisseur.distance)}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    ~{fournisseur.estimatedTime} min
                                  </div>
                                </div>
                              ) : (
                                <Badge variant="outline" className="text-orange-500 text-xs">
                                  Sans GPS
                                </Badge>
                              )}
                            </div>
                          </div>
                          {selectedSupplier?._id === fournisseur._id && (
                            <div className="mt-2 pt-2 border-t border-blue-200 flex items-center gap-1 text-blue-600 text-sm">
                              <CheckCircle className="h-4 w-4" />
                              Sélectionné
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Map with truck tracking */}
              {selectedSupplier && currentSite && selectedSupplier.coordinates && currentSite.coordinates ? (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Suivi de livraison
                  </Label>
                  <div className="h-64 rounded-lg overflow-hidden border-2 border-gray-200">
                    <MapContainer
                      center={[
                        (selectedSupplier.coordinates.lat + currentSite.coordinates.lat) / 2,
                        (selectedSupplier.coordinates.lng + currentSite.coordinates.lng) / 2
                      ]}
                      zoom={10}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="© OpenStreetMap"
                      />
                      <Marker 
                        position={[selectedSupplier.coordinates.lat, selectedSupplier.coordinates.lng]}
                        icon={supplierIcon}
                      >
                        <Popup>🏭 {selectedSupplier.nom}</Popup>
                      </Marker>
                      <Marker 
                        position={[currentSite.coordinates.lat, currentSite.coordinates.lng]}
                        icon={siteIcon}
                      >
                        <Popup>🏗️ {currentSite.nom}</Popup>
                      </Marker>
                      <Polyline
                        positions={[
                          [selectedSupplier.coordinates.lat, selectedSupplier.coordinates.lng],
                          [currentSite.coordinates.lat, currentSite.coordinates.lng]
                        ]}
                        color="blue"
                        weight={3}
                        dashArray="10, 10"
                      />
                      {truckPosition && (
                        <Marker position={[truckPosition.lat, truckPosition.lng]} icon={truckIcon}>
                          <Popup>🚚 Chantier → Fournisseur</Popup>
                        </Marker>
                      )}
                    </MapContainer>
                  </div>
                  {deliveryStatus === 'in_transit' && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Truck className="h-5 w-5 animate-pulse text-blue-600" />
                        <span className="text-sm text-blue-700">En livraison...</span>
                      </div>
                      <div className="text-sm text-blue-700">
                        Temps restant: ~{remainingTime} min
                      </div>
                    </div>
                  )}
                  {deliveryStatus === 'arrived' && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-green-700">Livré!</span>
                    </div>
                  )}
                  {deliveryStatus === 'pending' && trackingOrderId && (
                    <Button onClick={() => startDeliverySimulation(selectedSupplier, currentSite, trackingOrderId)} className="w-full bg-green-600 hover:bg-green-700">
                      <Truck className="h-4 w-4 mr-2" />
                      🚚 Démarrer livraison
                    </Button>
                  )}
                  {deliveryStatus === 'pending' && !trackingOrderId && (
                    <div className="text-sm text-gray-500 text-center p-2 bg-gray-100 rounded">
                      Cliquez "Créer commande" pour voir le suivi
                    </div>
                  )}
                </div>
              ) : selectedSupplier && currentSite ? (
                <div className="p-4 bg-orange-50 rounded-lg">
                  <AlertTriangle className="h-4 w-4 inline mr-2 text-orange-500" />
                  <span className="text-sm text-orange-700">
                    Le fournisseur ou le site n'a pas de coordonnées GPS. Le suivi n'est pas disponible.
                  </span>
                </div>
              ) : null}

              {/* Summary */}
              {selectedSupplier && currentSite && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="font-medium text-green-800">Récapitulatif</div>
                  <div className="text-sm text-green-700 mt-1 space-y-1">
                    <div>🏭 Fournisseur: {selectedSupplier.nom}</div>
                    <div>🏗️ Chantier: {currentSite.nom}</div>
                    {selectedSupplier.hasCoordinates && (
                      <div>📏 Distance: {formatDistance(recommendedSuppliers.find(f => f._id === selectedSupplier._id)?.distance || 0)}</div>
                    )}
                    {selectedSupplier.hasCoordinates && (
                      <div>⏱️ Durée estimée: {recommendedSuppliers.find(f => f._id === selectedSupplier._id)?.estimatedTime || 60} min</div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => {
            if (deliveryTimerRef.current) {
              clearInterval(deliveryTimerRef.current);
            }
            onClose();
          }}>
            {deliveryStatus === 'in_transit' ? 'Fermer (livraison en cours)' : 'Annuler'}
          </Button>
          <Button 
            onClick={handleCreateOrder} 
            disabled={loading || !selectedSupplier || deliveryStatus !== 'pending'}
          >
            {loading ? "Création..." : deliveryStatus === 'arrived' ? 'Livré!' : "Créer commande"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}