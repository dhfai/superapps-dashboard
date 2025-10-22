"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  IconUser,
  IconMail,
  IconPhone,
  IconMapPin,
  IconWorld,
  IconEdit,
  IconLoader2,
  IconCheck,
  IconAlertCircle,
  IconShield,
  IconTrash,
  IconLock,
  IconCalendar,
  IconDeviceFloppy,
  IconX,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface Profile {
  full_name: string;
  address: string;
  phone_number: string;
  country: string;
  created_at: string;
  updated_at: string;
}

interface UserInfo {
  id: string;
  username: string;
  email: string;
  is_active: boolean;
  email_verified: boolean;
  email_verified_at: string;
  profile: Profile;
}

export default function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const router = useRouter();

  // State
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Delete account states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'password' | 'otp'>('password');
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteOtp, setDeleteOtp] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    full_name: "",
    address: "",
    phone_number: "",
    country: "",
  });

  // Fetch user info
  const fetchUserInfo = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/user/info`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success && data.data) {
        setUserInfo(data.data);
        setFormData({
          full_name: data.data.profile?.full_name || "",
          address: data.data.profile?.address || "",
          phone_number: data.data.profile?.phone_number || "",
          country: data.data.profile?.country || "",
        });
      } else {
        setError(data.message || "Failed to load user info");
      }
    } catch (err) {
      setError("An error occurred while fetching user info");
    } finally {
      setLoading(false);
    }
  };

  // Update profile
  const handleUpdateProfile = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Profile updated successfully!");
        setIsEditing(false);
        await fetchUserInfo();
        await refreshUser();

        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to update profile");
      }
    } catch (err) {
      setError("An error occurred while updating profile");
    } finally {
      setSaving(false);
    }
  };

  // Request delete account
  const handleRequestDelete = async () => {
    if (!deletePassword) {
      setError("Please enter your password");
      return;
    }

    setDeletingAccount(true);
    setError("");

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/request-delete-account`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: deletePassword }),
      });

      const data = await response.json();

      if (data.success) {
        setDeleteStep('otp');
        setSuccess("OTP sent to your email. Please check your inbox.");
      } else {
        setError(data.message || "Failed to request account deletion");
      }
    } catch (err) {
      setError("An error occurred while requesting account deletion");
    } finally {
      setDeletingAccount(false);
    }
  };

  // Confirm delete account
  const handleConfirmDelete = async () => {
    if (!deleteOtp || deleteOtp.length !== 6) {
      setError("Please enter valid 6-digit OTP");
      return;
    }

    setDeletingAccount(true);
    setError("");

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/delete-account`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp_code: deleteOtp }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Account deleted successfully. Redirecting...");
        setTimeout(() => {
          logout();
          router.push('/');
        }, 2000);
      } else {
        setError(data.message || "Failed to delete account");
      }
    } catch (err) {
      setError("An error occurred while deleting account");
    } finally {
      setDeletingAccount(false);
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    if (userInfo) {
      setFormData({
        full_name: userInfo.profile?.full_name || "",
        address: userInfo.profile?.address || "",
        phone_number: userInfo.profile?.phone_number || "",
        country: userInfo.profile?.country || "",
      });
    }
    setError("");
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-3">
          <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Alert variant="destructive" className="max-w-md">
          <IconAlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load user information</AlertDescription>
        </Alert>
      </div>
    );
  }

  const initials = userInfo.username.slice(0, 2).toUpperCase();

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Profile Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your account settings and profile information
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <IconAlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
          <IconCheck className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700 dark:text-green-400">
            {success}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24 border-4 border-primary/20">
                <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary to-primary/60 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-2xl">{userInfo.username}</CardTitle>
            <CardDescription className="flex items-center justify-center gap-2">
              <IconMail className="h-4 w-4" />
              {userInfo.email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm font-medium">Status</span>
              <Badge variant={userInfo.is_active ? "default" : "secondary"}>
                {userInfo.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm font-medium">Email Verified</span>
              <Badge variant={userInfo.email_verified ? "default" : "destructive"}>
                {userInfo.email_verified ? (
                  <span className="flex items-center gap-1">
                    <IconCheck className="h-3 w-3" />
                    Verified
                  </span>
                ) : (
                  "Not Verified"
                )}
              </Badge>
            </div>
            {userInfo.email_verified_at && (
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-sm">
                  <IconCalendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Verified on</span>
                </div>
                <p className="text-sm font-medium mt-1">
                  {format(new Date(userInfo.email_verified_at), 'PPP')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information here
              </CardDescription>
            </div>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2">
                <IconEdit className="h-4 w-4" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleCancelEdit} variant="outline" size="sm" disabled={saving}>
                  <IconX className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button onClick={handleUpdateProfile} size="sm" disabled={saving}>
                  {saving ? (
                    <>
                      <IconLoader2 className="h-4 w-4 mr-1 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <IconDeviceFloppy className="h-4 w-4 mr-1" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="flex items-center gap-2">
                  <IconUser className="h-4 w-4" />
                  Full Name
                </Label>
                {isEditing ? (
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Enter your full name"
                    disabled={saving}
                  />
                ) : (
                  <p className="text-sm font-medium p-3 rounded-lg bg-muted/50">
                    {userInfo.profile?.full_name || "Not set"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number" className="flex items-center gap-2">
                  <IconPhone className="h-4 w-4" />
                  Phone Number
                </Label>
                {isEditing ? (
                  <Input
                    id="phone_number"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="+1234567890"
                    disabled={saving}
                  />
                ) : (
                  <p className="text-sm font-medium p-3 rounded-lg bg-muted/50">
                    {userInfo.profile?.phone_number || "Not set"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="country" className="flex items-center gap-2">
                  <IconWorld className="h-4 w-4" />
                  Country
                </Label>
                {isEditing ? (
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="United States"
                    disabled={saving}
                  />
                ) : (
                  <p className="text-sm font-medium p-3 rounded-lg bg-muted/50">
                    {userInfo.profile?.country || "Not set"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <IconCalendar className="h-4 w-4" />
                  Profile Created
                </Label>
                <p className="text-sm font-medium p-3 rounded-lg bg-muted/50">
                  {userInfo.profile?.created_at
                    ? format(new Date(userInfo.profile.created_at), 'PPP')
                    : "N/A"
                  }
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <IconMapPin className="h-4 w-4" />
                Address
              </Label>
              {isEditing ? (
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main Street, City, State, ZIP"
                  disabled={saving}
                />
              ) : (
                <p className="text-sm font-medium p-3 rounded-lg bg-muted/50">
                  {userInfo.profile?.address || "Not set"}
                </p>
              )}
            </div>

            {userInfo.profile?.updated_at && (
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Last updated: {format(new Date(userInfo.profile.updated_at), 'PPpp')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconShield className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </div>
          <CardDescription>
            Irreversible actions that will permanently affect your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border-2 border-destructive/20 bg-destructive/5">
            <div>
              <h3 className="font-semibold text-destructive">Delete Account</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => {
                setShowDeleteDialog(true);
                setDeleteStep('password');
                setDeletePassword("");
                setDeleteOtp("");
                setError("");
                setSuccess("");
              }}
              className="gap-2"
            >
              <IconTrash className="h-4 w-4" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <IconTrash className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              {deleteStep === 'password'
                ? "Enter your password to confirm account deletion. An OTP will be sent to your email."
                : "Enter the OTP code sent to your email to complete account deletion."
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <IconAlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
                <IconCheck className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700 dark:text-green-400">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            {deleteStep === 'password' ? (
              <div className="space-y-2">
                <Label htmlFor="delete-password" className="flex items-center gap-2">
                  <IconLock className="h-4 w-4" />
                  Password
                </Label>
                <Input
                  id="delete-password"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={deletingAccount}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="delete-otp" className="flex items-center gap-2">
                  <IconShield className="h-4 w-4" />
                  OTP Code
                </Label>
                <Input
                  id="delete-otp"
                  type="text"
                  maxLength={6}
                  value={deleteOtp}
                  onChange={(e) => setDeleteOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit OTP"
                  disabled={deletingAccount}
                  className="text-center text-2xl tracking-widest"
                />
                <p className="text-xs text-muted-foreground">
                  Check your email for the verification code
                </p>
              </div>
            )}

            <Alert variant="destructive">
              <IconAlertCircle className="h-4 w-4" />
              <AlertDescription>
                This action cannot be undone. All your data will be permanently deleted.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deletingAccount}
            >
              Cancel
            </Button>
            {deleteStep === 'password' ? (
              <Button
                variant="destructive"
                onClick={handleRequestDelete}
                disabled={deletingAccount || !deletePassword}
              >
                {deletingAccount ? (
                  <>
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <IconTrash className="mr-2 h-4 w-4" />
                    Send OTP
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deletingAccount || deleteOtp.length !== 6}
              >
                {deletingAccount ? (
                  <>
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <IconTrash className="mr-2 h-4 w-4" />
                    Confirm Delete
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
