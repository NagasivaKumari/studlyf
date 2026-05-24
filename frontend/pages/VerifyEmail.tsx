
import { API_BASE_URL } from '../apiConfig';
import AuthLayout from '../components/AuthLayout';
import AuthCard from '../components/AuthCard';


            try {
                const res = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },

                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-6"
                    >
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 size={32} />
                        </div>
                        <h2 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Email Verified</h2>
                        <p className="text-sm text-gray-500 mb-8">

                    </motion.div>
                )}
            </AuthCard>
        </AuthLayout>
    );
};

