import { api } from '../api/client';

export async function listVoitures(params = {}) {
  const { data } = await api.get('/voitures', { params });
  return data;
}

export async function getVoitureById(voitureId) {
  const { data } = await api.get(`/voitures/${voitureId}`);
  return data;
}

function buildVoitureFormData(payload) {
  const formData = new FormData();

  if (payload.marque_id !== undefined && payload.marque_id !== '' && payload.marque_id !== null) {
    formData.append('marque_id', payload.marque_id);
  }
  if (payload.immatriculation !== undefined) {
    formData.append('immatriculation', payload.immatriculation);
  }
  if (payload.modele !== undefined) {
    formData.append('modele', payload.modele);
  }
  if (payload.annee !== undefined && payload.annee !== '') {
    formData.append('annee', payload.annee);
  }
  if (payload.prix_par_jour !== undefined && payload.prix_par_jour !== '') {
    formData.append('prix_par_jour', payload.prix_par_jour);
  }
  if (payload.statut !== undefined && payload.statut !== '') {
    formData.append('statut', payload.statut);
  }
  if (payload.categorie !== undefined && payload.categorie !== '' && payload.categorie !== null) {
    formData.append('categorie', payload.categorie);
  }
  if (payload.image instanceof File) {
    formData.append('image', payload.image);
  }
  if (payload.remove_image) {
    formData.append('remove_image', '1');
  }

  return formData;
}

export async function createVoiture(payload) {
  const formData = buildVoitureFormData(payload);

  const { data } = await api.post('/voitures', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function updateVoiture(voitureId, payload) {
  const formData = buildVoitureFormData(payload);
  // Laravel ne lit pas multipart sur PUT/PATCH ; on utilise POST + _method=PUT
  formData.append('_method', 'PUT');

  const { data } = await api.post(`/voitures/${voitureId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteVoiture(voitureId) {
  const { data } = await api.delete(`/voitures/${voitureId}`);
  return data;
}
