import axios from 'axios';

export const getNominalByCoords = async (
  latitude: number,
  longitude: number,
  lang: string
): Promise<string | null> => {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;

  try {
    const response = await axios.get(url, {
      headers: {
        'Accept-Language': lang,
      },
    });
    const { data: dataField } = response;

    if (dataField.display_name) {
      return dataField.display_name;
    }
    return null;
  } catch (error) {
    return null;
  }
};
