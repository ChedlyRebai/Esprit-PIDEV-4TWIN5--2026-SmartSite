import { RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import { Progress } from '../../components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { PasswordGenerator } from '../../utils/passwordGenerator';

export default function Profile() {
  const user = useAuthStore((state) => state.user);
  const changePassword = useAuthStore((state) => state.changePassword);
  const [editData, setEditData] = useState({
    firstname: user?.firstname || '',
    lastname: user?.lastname || '',
  });
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [passwordStrength, setPasswordStrength] = useState({ 
    score: 0, 
    strength: 'Très faible' as const, 
    color: 'bg-red-500'
  });
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Mettre à jour la force du mot de passe quand l'utilisateur tape
  useEffect(() => {
    if (passwords.new) {
      const strength = PasswordGenerator.evaluatePasswordStrength(passwords.new);
      setPasswordStrength(strength);
      setShowPasswordStrength(true);
    } else {
      setShowPasswordStrength(false);
    }
  }, [passwords.new]);

  // Générer un nouveau mot de passe fort
  const generateNewPassword = () => {
    const newPassword = PasswordGenerator.generateStrongPassword(14);
    setPasswords({ ...passwords, new: newPassword, confirm: '' });
    toast.success('Mot de passe fort généré!');
  };

  if (!user) return null;

  const getInitials = (firstname: string, lastname: string) => {
    return `${firstname.charAt(0)}${lastname.charAt(0)}`.toUpperCase();
  };

  const handleSaveProfile = () => {
    if (!editData.firstname || !editData.lastname) {
      toast.error('Le prénom et le nom sont requis');
      return;
    }
    toast.success('Profil mis à jour avec succès!');
  };

  const handleChangePassword = async () => {
    // Validation des champs
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast.error('Tous les champs de mot de passe sont requis');
      return;
    }
    
    if (passwords.new !== passwords.confirm) {
      toast.error('Les nouveaux mots de passe ne correspondent pas');
      return;
    }
    
    if (!PasswordGenerator.isStrongPassword(passwords.new)) {
      toast.error('Le mot de passe est trop faible. Veuillez choisir un mot de passe plus fort.');
      return;
    }
    
    setIsChangingPassword(true);
    
    try {
      // Appel API pour changer le mot de passe
      await changePassword(passwords.current, passwords.new);
      
      toast.success('Mot de passe changé avec succès!');
      setPasswords({ current: '', new: '', confirm: '' });
      setShowPasswordStrength(false);
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error changing password:', error);
      if (error.response?.status === 401) {
        toast.error('Mot de passe actuel incorrect');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Erreur lors du changement de mot de passe');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Réinitialiser les états quand le dialogue se ferme
  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setPasswords({ current: '', new: '', confirm: '' });
      setShowPasswordStrength(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mon Profil</h1>
        <p className="text-gray-500 mt-1">Gérez vos informations personnelles</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations Personnelles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-green-600 text-white text-2xl">
                {getInitials(user.firstname, user.lastname)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <div className="flex gap-3 pt-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
                      Modifier le Profil
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Modifier le Profil</DialogTitle>
                      <DialogDescription>
                        Mettez à jour vos informations personnelles
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstname">Prénom</Label>
                          <Input
                            id="firstname"
                            value={editData.firstname}
                            onChange={(e) => setEditData({ ...editData, firstname: e.target.value })}
                            placeholder="Prénom"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastname">Nom</Label>
                          <Input
                            id="lastname"
                            value={editData.lastname}
                            onChange={(e) => setEditData({ ...editData, lastname: e.target.value })}
                            placeholder="Nom"
                          />
                        </div>
                      </div>
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                        onClick={handleSaveProfile}
                      >
                        Sauvegarder les modifications
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
                  <DialogTrigger asChild>
                    <Button variant="outline">Changer le Mot de Passe</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Changer le Mot de Passe</DialogTitle>
                      <DialogDescription>
                        Entrez votre mot de passe actuel et votre nouveau mot de passe
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current">Mot de Passe Actuel</Label>
                        <Input
                          id="current"
                          type="password"
                          value={passwords.current}
                          onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                          placeholder="Entrez votre mot de passe actuel"
                          disabled={isChangingPassword}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="new">Nouveau Mot de Passe</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  type="button"
                                  variant="outline" 
                                  size="sm"
                                  onClick={generateNewPassword}
                                  className="text-xs"
                                  disabled={isChangingPassword}
                                >
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  Générer un mot de passe fort
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Génère un mot de passe fort aléatoirement</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Input
                          id="new"
                          type="text"
                          value={passwords.new}
                          onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                          placeholder="Entrez votre nouveau mot de passe"
                          className="font-mono"
                          disabled={isChangingPassword}
                        />
                        
                        {showPasswordStrength && (
                          <div className="mt-2">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-600">Force du mot de passe:</span>
                              <span className={`text-xs font-semibold ${passwordStrength.color.replace('bg-', 'text-')}`}>
                                {passwordStrength.strength}
                              </span>
                            </div>
                            <Progress 
                              value={(passwordStrength.score / 6) * 100} 
                              className={passwordStrength.color}
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm">Confirmer le Mot de Passe</Label>
                        <Input
                          id="confirm"
                          type="password"
                          value={passwords.confirm}
                          onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                          placeholder="Confirmez votre nouveau mot de passe"
                          disabled={isChangingPassword}
                        />
                        {passwords.confirm && passwords.new !== passwords.confirm && (
                          <p className="text-xs text-red-500">Les mots de passe ne correspondent pas</p>
                        )}
                      </div>

                      <Button 
                        className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                        onClick={handleChangePassword}
                        disabled={isChangingPassword}
                      >
                        {isChangingPassword ? 'Changement en cours...' : 'Mettre à jour le mot de passe'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}