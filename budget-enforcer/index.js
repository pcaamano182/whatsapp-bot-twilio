// Cloud Function para deshabilitar facturación cuando se exceda el presupuesto
const { CloudBillingClient } = require('@google-cloud/billing');
const billingClient = new CloudBillingClient();

const PROJECT_ID = process.env.GCP_PROJECT;
const PROJECT_NAME = `projects/${PROJECT_ID}`;

/**
 * Deshabilita la facturación del proyecto cuando se excede el presupuesto
 * ADVERTENCIA: Esto detendrá TODOS los servicios del proyecto
 */
exports.stopBilling = async (pubsubEvent) => {
  const pubsubData = JSON.parse(
    Buffer.from(pubsubEvent.data, 'base64').toString()
  );

  if (pubsubData.costAmount <= pubsubData.budgetAmount) {
    console.log(`Costo actual $${pubsubData.costAmount} está dentro del presupuesto $${pubsubData.budgetAmount}`);
    return;
  }

  // Si superamos el 100% del presupuesto, deshabilitar facturación
  const percentUsed = (pubsubData.costAmount / pubsubData.budgetAmount) * 100;

  if (percentUsed >= 100) {
    console.log(`⚠️ PRESUPUESTO EXCEDIDO: ${percentUsed.toFixed(2)}% usado ($${pubsubData.costAmount}/$${pubsubData.budgetAmount})`);

    try {
      const [billingInfo] = await billingClient.getProjectBillingInfo({ name: PROJECT_NAME });

      if (billingInfo.billingEnabled) {
        console.log('🛑 Deshabilitando facturación del proyecto...');

        await billingClient.updateProjectBillingInfo({
          name: PROJECT_NAME,
          projectBillingInfo: {
            billingAccountName: '' // Deshabilita la facturación
          }
        });

        console.log('✅ Facturación deshabilitada exitosamente');
      } else {
        console.log('ℹ️ La facturación ya estaba deshabilitada');
      }
    } catch (error) {
      console.error('❌ Error deshabilitando facturación:', error);
      throw error;
    }
  } else {
    console.log(`⚠️ Alerta: ${percentUsed.toFixed(2)}% del presupuesto usado ($${pubsubData.costAmount}/$${pubsubData.budgetAmount})`);
  }
};
